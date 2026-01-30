package com.caredroid.clinical.network

data class HealthResponse(
    val status: String,
    val timestamp: String,
    val service: String,
    val version: String
)

data class WelcomeResponse(
    val message: String,
    val version: String,
    val docs: String,
    val health: String,
    val endpoints: Map<String, String>
)
