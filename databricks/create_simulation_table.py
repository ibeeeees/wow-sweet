# Databricks notebook source
# MAGIC %md
# MAGIC # Create Simulation Results Table
# MAGIC One-time setup: creates `sweetreturns.gold.simulation_results` Delta table
# MAGIC to store frontend simulation feedback (agent trades + crowd metrics).

# COMMAND ----------

from pyspark.sql import SparkSession

spark = SparkSession.builder.getOrCreate()

# COMMAND ----------

spark.sql("""
    CREATE TABLE IF NOT EXISTS sweetreturns.gold.simulation_results (
        snapshot_date    DATE        COMMENT 'Trading day this simulation ran against',
        ticker           STRING      COMMENT 'Stock ticker',
        agent_name       STRING      COMMENT 'Name of the trading agent',
        action           STRING      COMMENT 'BUY, CALL, PUT, or SHORT',
        profit           DOUBLE      COMMENT 'P&L from this trade in dollars',
        whale_fund       STRING      COMMENT 'Whale fund name if applicable, NULL for regular agents',
        whale_weight     DOUBLE      COMMENT 'Portfolio weight if whale allocation, NULL otherwise',
        buy_crowd        INT         COMMENT 'Number of agents in BUY lane at this store',
        call_crowd       INT         COMMENT 'Number of agents in CALL lane at this store',
        put_crowd        INT         COMMENT 'Number of agents in PUT lane at this store',
        short_crowd      INT         COMMENT 'Number of agents in SHORT lane at this store',
        submitted_at     TIMESTAMP   COMMENT 'When this record was submitted from frontend'
    )
    USING DELTA
    COMMENT 'Frontend simulation results fed back into the pipeline loop'
    PARTITIONED BY (snapshot_date)
""")

print("✓ Table sweetreturns.gold.simulation_results created (or already exists)")

# COMMAND ----------

# Verify table exists and show schema
spark.sql("DESCRIBE TABLE sweetreturns.gold.simulation_results").show(truncate=False)
