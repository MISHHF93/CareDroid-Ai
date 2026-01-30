package com.caredroid.clinical.network

import retrofit2.http.GET

interface ApiService {
    
    @GET("/health")
    suspend fun getHealth(): HealthResponse
    
    @GET("/")
    suspend fun getWelcome(): WelcomeResponse
    
    // Add more API endpoints as needed
    // Example:
    // @POST("/api/chat/message-3d")
    // suspend fun sendMessage(@Body request: ChatRequest): ChatResponse
}
