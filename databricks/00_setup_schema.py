# Databricks notebook source
# MAGIC %md
# MAGIC # Schema Setup
# MAGIC Creates the sweetreturns catalog and bronze/silver/gold/ml_models schemas.

# COMMAND ----------

# MAGIC %sql
# MAGIC CREATE CATALOG IF NOT EXISTS sweetreturns;
# MAGIC USE CATALOG sweetreturns;
# MAGIC CREATE SCHEMA IF NOT EXISTS bronze;
# MAGIC CREATE SCHEMA IF NOT EXISTS silver;
# MAGIC CREATE SCHEMA IF NOT EXISTS gold;
# MAGIC CREATE SCHEMA IF NOT EXISTS ml_models;
# MAGIC -- UC Volume for CSV input and JSON output (no DBFS needed)
# MAGIC CREATE SCHEMA IF NOT EXISTS landing;
# MAGIC CREATE VOLUME IF NOT EXISTS sweetreturns.landing.data;

# COMMAND ----------

print("Schema setup complete!")
print("UC Volume created at: /Volumes/sweetreturns/landing/data/")
print("")
print("Next: upload stock_details_5_years.csv to the volume.")
print("  UI:  Catalog → sweetreturns → landing → data → Upload")
print("  CLI: databricks fs cp stock_details_5_years.csv /Volumes/sweetreturns/landing/data/stock_details_5_years.csv")
