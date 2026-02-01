package com.caredroid.clinical.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.caredroid.clinical.ui.screens.HomeScreen
import com.caredroid.clinical.util.AppConstants

/**
 * Application Navigation Graph
 * Handles routing between all screens
 */
@Composable
fun AppNavigation(navController: NavHostController) {
    NavHost(
        navController = navController,
        startDestination = AppConstants.Routes.CHAT
    ) {
        composable(AppConstants.Routes.CHAT) {
            HomeScreen()
        }
        
        // Phase 2 and beyond - add more screens
        // composable(AppConstants.Routes.LOGIN) { LoginScreen() }
        // composable(AppConstants.Routes.SETTINGS) { SettingsScreen() }
        // composable(AppConstants.Routes.PROFILE) { ProfileScreen() }
        // composable(AppConstants.Routes.TEAM) { TeamManagementScreen() }
        // composable(AppConstants.Routes.AUDIT) { AuditLogsScreen() }
    }
}
