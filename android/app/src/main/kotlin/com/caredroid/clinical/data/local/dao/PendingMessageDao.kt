package com.caredroid.clinical.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.caredroid.clinical.data.local.entity.PendingMessageEntity

@Dao
interface PendingMessageDao {

    @Query("SELECT * FROM pending_messages ORDER BY timestamp ASC")
    suspend fun getAllPending(): List<PendingMessageEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPending(message: PendingMessageEntity)

    @Query("DELETE FROM pending_messages WHERE id = :id")
    suspend fun deletePending(id: Long)

    @Query("UPDATE pending_messages SET retryCount = retryCount + 1 WHERE id = :id")
    suspend fun incrementRetryCount(id: Long)

    @Query("DELETE FROM pending_messages WHERE retryCount >= 3")
    suspend fun deleteFailedMessages()

    @Query("DELETE FROM pending_messages")
    suspend fun deleteAll()
}