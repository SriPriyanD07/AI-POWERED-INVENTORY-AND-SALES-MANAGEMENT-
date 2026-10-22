"""
SmartRetail DA3 — AI Demand Forecasting & Predictive Optimization Tests
Module: da3_mongodb/tests/test_ai_forecasting.py
"""

import pytest
from fastapi.testclient import TestClient
from da3_mongodb.src.services.ai_forecasting_service import AIForecastingService
from da3_mongodb.src.api import app


@pytest.fixture
def ai_service(test_db):
    return AIForecastingService(test_db)


def test_ai_forecasting_overview(test_db, ai_service):
    """Verify catalog-wide portfolio forecast aggregation and metrics."""
    overview = ai_service.get_forecast_overview(horizon_days=7)
    
    assert overview["total_products_analyzed"] > 0
    assert "total_predicted_units" in overview
    assert overview["total_predicted_units"] >= 0
    assert "high_stockout_risk_count" in overview
    assert "reorder_action_required_count" in overview
    assert "portfolio_health_score" in overview
    assert isinstance(overview["products"], list)
    assert len(overview["products"]) == overview["total_products_analyzed"]

    # Check structure of each product entry in overview
    first_item = overview["products"][0]
    assert "product_id" in first_item
    assert "product_name" in first_item
    assert "stockout_risk" in first_item
    assert first_item["stockout_risk"] in ["HIGH", "MEDIUM", "LOW"]
    assert "forecast_period_demand" in first_item
    assert "runout_days" in first_item


def test_ai_product_forecast_detailed(test_db, ai_service):
    """Verify single product time-series projection, CI bands, and safety stock."""
    # Test product 1 (Organic Whole Milk)
    fc = ai_service.generate_product_forecast(product_id=1, horizon_days=14)
    
    assert fc["product_id"] == 1
    assert len(fc["forecast_points"]) == 14
    assert fc["metrics"]["daily_velocity"] >= 0.0
    assert fc["recommendations"]["suggested_safety_stock"] >= 0
    assert fc["recommendations"]["suggested_reorder_threshold"] >= 0
    assert fc["inventory"]["total_on_hand"] >= 0

    # Verify 95% confidence interval integrity: upper_bound >= predicted >= lower_bound >= 0
    for pt in fc["forecast_points"]:
        assert pt["upper_bound"] >= pt["predicted_quantity"]
        assert pt["predicted_quantity"] >= pt["lower_bound"]
        assert pt["lower_bound"] >= 0.0
        assert "date" in pt


def test_ai_apply_recommendation(test_db, ai_service):
    """Verify 1-click AI calibration updates inventory_stock thresholds and batch sizes."""
    # Product 1
    res = ai_service.apply_ai_recommendation(product_id=1)
    assert res["success"] is True
    assert res["product_id"] == 1
    assert "applied_threshold" in res
    assert "applied_batch_quantity" in res
    assert res["records_updated"] >= 1

    # Verify database was updated in MongoDB
    updated_stock = test_db.inventory_stock.find_one({"product_id": 1})
    assert updated_stock["reorder_threshold"] == res["applied_threshold"]
    assert updated_stock["reorder_quantity"] == res["applied_batch_quantity"]
    assert updated_stock.get("optimized_by_ai") is True


def test_ai_generate_preventive_purchase_order(test_db, ai_service):
    """Verify preventive PO generation creates valid procurement records in MongoDB."""
    res = ai_service.generate_preventive_purchase_order(product_id=1)
    
    assert res["success"] is True
    assert "po_number" in res
    assert res["quantity_ordered"] > 0
    assert "po_id" in res

    # Verify document exists in purchase_orders collection
    po_doc = test_db.purchase_orders.find_one({"po_number": res["po_number"]})
    assert po_doc is not None
    assert po_doc["status"] in ["APPROVED", "PENDING"]
    assert len(po_doc["items"]) >= 1
    assert po_doc["items"][0]["product_id"] == 1
    assert po_doc["items"][0]["quantity_ordered"] == res["quantity_ordered"]


def test_ai_api_endpoints():
    """Verify all 4 FastAPI REST routes using TestClient."""
    client = TestClient(app)

    # 1. Overview endpoint
    resp_overview = client.get("/ai/forecast/overview?horizon_days=7")
    assert resp_overview.status_code == 200
    data_overview = resp_overview.json()
    assert "total_products_analyzed" in data_overview
    assert "products" in data_overview

    # 2. Single product forecast endpoint
    resp_prod = client.get("/ai/forecast/product/1?horizon_days=7")
    assert resp_prod.status_code == 200
    data_prod = resp_prod.json()
    assert data_prod["product_id"] == 1
    assert len(data_prod["forecast_points"]) == 7

    # 3. Apply recommendation endpoint
    resp_apply = client.post("/ai/forecast/apply-recommendation/1")
    assert resp_apply.status_code == 200
    data_apply = resp_apply.json()
    assert data_apply["success"] is True
    assert "applied_threshold" in data_apply

    # 4. Generate preventive PO endpoint
    resp_po = client.post("/ai/forecast/generate-po/1")
    assert resp_po.status_code == 200
    data_po = resp_po.json()
    assert data_po["success"] is True
    assert "po_number" in data_po
