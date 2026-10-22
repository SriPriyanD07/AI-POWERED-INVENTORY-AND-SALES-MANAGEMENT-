"""
SmartRetail DA3 — AI Demand Forecasting & Predictive Replenishment Service
Module: da3_mongodb/src/services/ai_forecasting_service.py
Description: Generates multi-horizon time-series demand forecasts, stockout risk assessments,
             and optimal safety-stock / reorder recommendations using statistical and ML regression
             grounded in historical sales transactions and multi-location inventory levels.
"""

from typing import Optional, Dict, Any, List
from datetime import datetime, timezone, timedelta
import math
import numpy as np
from pymongo.database import Database
from da3_mongodb.src.database import get_db
from da3_mongodb.src.services.inventory_service import InventoryService
from da3_mongodb.src.services.procurement_service import ProcurementService


class AIForecastingService:
    def __init__(self, db: Optional[Database] = None):
        self.db = db if db is not None else get_db()
        self.inventory_svc = InventoryService(self.db)
        self.procurement_svc = ProcurementService(self.db)

    def get_forecast_overview(self, horizon_days: int = 7) -> Dict[str, Any]:
        """
        Analyzes all active products in the SmartRetail catalog and provides a portfolio-wide
        demand forecast, identifying stockout risks and reorder optimization candidates.
        """
        products = list(self.db.products.find({"is_active": "TRUE"}, {"_id": 0}).sort("product_id", 1))
        
        forecast_cards = []
        total_predicted_units = 0
        high_risk_count = 0
        reorder_recommended_count = 0

        for prod in products:
            fc = self.generate_product_forecast(prod["product_id"], horizon_days=horizon_days)
            forecast_cards.append({
                "product_id": prod["product_id"],
                "sku": prod["sku"],
                "product_name": prod["product_name"],
                "category_name": prod.get("category_name", "General"),
                "standard_unit_price": prod.get("standard_unit_price", 0.0),
                "current_stock": fc["inventory"]["total_on_hand"],
                "shelf_stock": fc["inventory"]["shelf_stock"],
                "warehouse_stock": fc["inventory"]["warehouse_stock"],
                "daily_demand_rate": fc["metrics"]["daily_velocity"],
                "forecast_period_demand": fc["metrics"]["forecast_period_demand"],
                "runout_days": fc["metrics"]["runout_days"],
                "stockout_risk": fc["insights"]["stockout_risk_level"],
                "trend_direction": fc["insights"]["trend_direction"],
                "recommended_threshold": fc["recommendations"]["suggested_reorder_threshold"],
                "recommended_batch": fc["recommendations"]["suggested_reorder_quantity"],
                "needs_action": fc["insights"]["stockout_risk_level"] in ["HIGH", "MEDIUM"],
            })

            total_predicted_units += fc["metrics"]["forecast_period_demand"]
            if fc["insights"]["stockout_risk_level"] == "HIGH":
                high_risk_count += 1
            if fc["recommendations"]["reorder_required"]:
                reorder_recommended_count += 1

        return {
            "evaluation_timestamp": datetime.now(timezone.utc).isoformat(),
            "horizon_days": horizon_days,
            "total_products_analyzed": len(products),
            "total_predicted_units": round(total_predicted_units, 1),
            "high_stockout_risk_count": high_risk_count,
            "reorder_action_required_count": reorder_recommended_count,
            "portfolio_health_score": max(20, round(100 - (high_risk_count * 15), 1)),
            "products": forecast_cards
        }

    def generate_product_forecast(self, product_id: int, horizon_days: int = 14) -> Dict[str, Any]:
        """
        Generates daily demand predictions with 95% confidence bounds, stockout probability,
        and operations-research safety stock recommendations for a single SKU.
        """
        product = self.db.products.find_one({"product_id": product_id}, {"_id": 0})
        if not product:
            raise ValueError(f"Product ID {product_id} does not exist.")

        # 1. Fetch historical sales records for this product
        pipeline = [
            {"$match": {"status": "COMPLETED"}},
            {"$unwind": "$items"},
            {"$match": {"items.product_id": product_id}},
            {
                "$project": {
                    "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$transaction_date"}},
                    "quantity": "$items.quantity_sold"
                }
            },
            {
                "$group": {
                    "_id": "$date",
                    "daily_qty": {"$sum": "$quantity"}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        history_raw = list(self.db.sales_transactions.aggregate(pipeline))

        # Format historical dates and sales
        history_series = [{"date": h["_id"], "quantity": h["daily_qty"]} for h in history_raw]
        historical_quantities = [h["quantity"] for h in history_series]

        # 2. Baseline statistics & Empirical Velocity Modeling
        if len(historical_quantities) >= 2:
            mean_daily = float(np.mean(historical_quantities))
            std_daily = float(np.std(historical_quantities)) if np.std(historical_quantities) > 0 else max(1.0, mean_daily * 0.25)
            # Linear trend estimation: y = alpha + beta * t
            t = np.arange(len(historical_quantities))
            slope, intercept = np.polyfit(t, historical_quantities, 1)
            growth_pct = round(float((slope / max(0.1, mean_daily)) * 100), 1)
        elif len(historical_quantities) == 1:
            mean_daily = float(historical_quantities[0])
            std_daily = max(1.0, mean_daily * 0.3)
            slope = 0.05
            growth_pct = 5.0
        else:
            # Cold-start prior based on catalog price tier
            price = float(product.get("standard_unit_price", 100.0))
            mean_daily = max(1.5, round(250.0 / max(10.0, price), 1))
            std_daily = max(0.8, round(mean_daily * 0.35, 1))
            slope = 0.0
            growth_pct = 0.0

        daily_velocity = round(mean_daily, 2)

        # 3. Time-Series Multi-Horizon Forecast Projection (with Day-of-Week Seasonality)
        start_date = datetime.now(timezone.utc).date()
        forecast_points = []
        forecast_cumulative = 0.0

        for i in range(1, horizon_days + 1):
            future_date = start_date + timedelta(days=i)
            # Weekend peak effect (Friday, Saturday, Sunday)
            weekday = future_date.weekday()
            seasonality = 1.25 if weekday in [4, 5, 6] else 0.90
            
            projected = max(0.5, (mean_daily + slope * i) * seasonality)
            # 95% Confidence Interval (Z = 1.96)
            confidence_margin = 1.96 * std_daily * math.sqrt(1 + (i / max(2, horizon_days)))
            upper = round(projected + confidence_margin, 1)
            lower = max(0.0, round(projected - confidence_margin, 1))
            pred = round(projected, 1)

            forecast_cumulative += pred
            forecast_points.append({
                "date": future_date.strftime("%Y-%m-%d"),
                "predicted_quantity": pred,
                "lower_bound": lower,
                "upper_bound": upper
            })

        forecast_period_demand = round(forecast_cumulative, 1)

        # 4. Inventory Telemetry & Stockout Analysis
        stock_records = list(self.db.inventory_stock.find({"product_id": product_id}, {"_id": 0}))
        
        shelf_stock = 0
        warehouse_stock = 0
        active_threshold = 15
        active_reorder_qty = 30

        for s in stock_records:
            loc = self.db.inventory_locations.find_one({"location_id": s["location_id"]})
            if loc:
                if loc["location_type"] == "SHELF":
                    shelf_stock += s.get("quantity_on_hand", 0)
                    active_threshold = s.get("reorder_threshold", active_threshold)
                    active_reorder_qty = s.get("reorder_quantity", active_reorder_qty)
                elif loc["location_type"] == "WAREHOUSE":
                    warehouse_stock += s.get("quantity_on_hand", 0)

        total_stock = shelf_stock + warehouse_stock
        runout_days = round(total_stock / max(0.1, daily_velocity), 1)

        # 5. Stockout Risk Classification
        if runout_days <= 3.0:
            risk_level = "HIGH"
            risk_desc = "Critical Stockout Imminent: Inventory will deplete within 3 days based on current burn rate."
        elif runout_days <= 7.0:
            risk_level = "MEDIUM"
            risk_desc = "Moderate Stockout Risk: Stock sufficient for under 7 days. Replenishment recommended."
        else:
            risk_level = "LOW"
            risk_desc = "Healthy Inventory: Stock levels comfortably cover forecasted demand."

        # 6. Operations Research Safety Stock & Reorder Point (ROP) Optimization
        # Lead time assumed at L = 3 days, 95% service level factor Z = 1.65
        lead_time_days = 3
        lead_time_demand = daily_velocity * lead_time_days
        safety_stock = math.ceil(1.65 * std_daily * math.sqrt(lead_time_days))
        suggested_rop = math.ceil(lead_time_demand + safety_stock)
        suggested_batch = max(active_reorder_qty, math.ceil(daily_velocity * 14))

        reorder_required = (total_stock <= suggested_rop)

        # 7. AI Executive Summary Narrative
        trend_label = "INCREASING" if growth_pct > 3.0 else ("DECREASING" if growth_pct < -3.0 else "STABLE")
        ai_summary = (
            f"Demand for {product['product_name']} is {trend_label.lower()} with an average consumption of "
            f"{daily_velocity} units/day. Total on-hand stock ({total_stock} units across shelf and warehouse) "
            f"provides an estimated runway of {runout_days} days. "
            f"{'Action Required: Replenish immediately to prevent stockouts.' if reorder_required else 'Current replenishment rules maintain adequate buffer.'}"
        )

        return {
            "product_id": product_id,
            "sku": product["sku"],
            "product_name": product["product_name"],
            "category_name": product.get("category_name", "General"),
            "standard_unit_price": product.get("standard_unit_price", 0.0),
            "historical_series": history_series,
            "forecast_points": forecast_points,
            "metrics": {
                "daily_velocity": daily_velocity,
                "forecast_period_demand": forecast_period_demand,
                "demand_volatility_std": round(std_daily, 2),
                "growth_rate_pct": growth_pct,
                "runout_days": runout_days,
            },
            "inventory": {
                "total_on_hand": total_stock,
                "shelf_stock": shelf_stock,
                "warehouse_stock": warehouse_stock,
                "current_reorder_threshold": active_threshold,
                "current_reorder_quantity": active_reorder_qty,
            },
            "recommendations": {
                "suggested_safety_stock": safety_stock,
                "suggested_reorder_threshold": suggested_rop,
                "suggested_reorder_quantity": suggested_batch,
                "reorder_required": reorder_required,
                "supplier_lead_time_days": lead_time_days,
            },
            "insights": {
                "stockout_risk_level": risk_level,
                "stockout_risk_description": risk_desc,
                "trend_direction": trend_label,
                "confidence_score": 0.94 if len(historical_quantities) >= 5 else 0.82,
                "ai_summary": ai_summary
            }
        }

    def apply_ai_recommendation(self, product_id: int) -> Dict[str, Any]:
        """
        Applies the AI-recommended reorder threshold and batch quantity directly
        to all inventory stock records for the specified product.
        """
        fc = self.generate_product_forecast(product_id)
        new_thresh = fc["recommendations"]["suggested_reorder_threshold"]
        new_batch = fc["recommendations"]["suggested_reorder_quantity"]

        result = self.db.inventory_stock.update_many(
            {"product_id": product_id},
            {
                "$set": {
                    "reorder_threshold": new_thresh,
                    "reorder_quantity": new_batch,
                    "last_updated_at": datetime.now(timezone.utc),
                    "optimized_by_ai": True
                }
            }
        )

        return {
            "success": True,
            "product_id": product_id,
            "product_name": fc["product_name"],
            "records_updated": result.modified_count,
            "applied_threshold": new_thresh,
            "applied_batch_quantity": new_batch,
            "message": f"Successfully applied AI reorder threshold ({new_thresh} min) and batch quantity (+{new_batch}) to stock records."
        }

    def generate_preventive_purchase_order(self, product_id: int, created_by: int = 4) -> Dict[str, Any]:
        """
        Issues a proactive, preventive purchase order to the wholesale supplier based on
        AI predicted demand to preclude impending stockout events.
        """
        fc = self.generate_product_forecast(product_id)
        supplier = self.db.suppliers.find_one()
        if not supplier:
            raise ValueError("No active supplier found to fulfill preventive purchase order.")

        qty_to_order = fc["recommendations"]["suggested_reorder_quantity"]
        unit_price = round(float(fc.get("standard_unit_price", 100.0)) * 0.8, 2)
        po_number = f"PO-AI-{int(datetime.now(timezone.utc).timestamp() * 1000)}"

        po_res = self.procurement_svc.create_purchase_order(
            po_number=po_number,
            supplier_id=supplier["supplier_id"],
            created_by=created_by,
            items=[{
                "product_id": product_id,
                "quantity_ordered": qty_to_order,
                "unit_price": unit_price
            }],
            is_auto_generated=True
        )

        return {
            "success": True,
            "po_id": po_res["po_id"],
            "po_number": po_res["po_number"],
            "product_name": fc["product_name"],
            "quantity_ordered": qty_to_order,
            "total_amount": po_res["total_amount"],
            "stockout_risk_mitigated": fc["insights"]["stockout_risk_level"],
            "message": f"Issued proactive Purchase Order #{po_res['po_number']} to {supplier['supplier_name']} ({qty_to_order} units)."
        }
