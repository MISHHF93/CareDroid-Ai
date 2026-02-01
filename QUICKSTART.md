# 🚀 Quick Start Guide - Sidebar Navigation

## Port Configuration

The application uses the following ports:
- **Frontend (Vite):** Port 8000
- **Backend (NestJS):** Port 3000

The Vite dev server automatically proxies API requests from `/api` to `http://localhost:3000`.

---

## Starting the Application

### Option 1: Start Both Servers Together (Recommended)

```powershell
npm run start:all
```

This command uses `concurrently` to start both the backend and frontend simultaneously.

### Option 2: Start Servers Separately

**Terminal 1 - Backend (Port 3000):**
```powershell
cd backend
npm run start:dev
```

**Terminal 2 - Frontend (Port 8000):**
```powershell
npm run dev
```

---

## Accessing the Application

Once both servers are running:

- **Frontend:** http://localhost:8000
- **Backend API:** http://localhost:3000/api
- **Swagger Docs:** http://localhost:3000/api
- **Health Check:** http://localhost:3000/health

---

## Testing the New Sidebar Navigation

### Desktop Experience
1. Open http://localhost:8000 in your browser
2. Log in with your credentials
3. **Sidebar opens automatically** - You'll see the full navigation
4. **Click the hamburger menu (☰)** - Sidebar slides closed
5. **Navigate using sidebar items:**
   - 💬 Chat - Main chat interface
   - 👥 Team - Team management (requires permission)
   - 📋 Audit Logs - Security logs (requires permission)
   - 👤 Profile - Your profile
   - ⚙️ Settings - App settings

### Mobile Experience (Resize browser to < 1024px)
1. Resize browser window to mobile size
2. **Tap hamburger menu** in top bar - Sidebar slides in from left
3. **Tap outside sidebar** - Sidebar closes
4. **Navigate** - Sidebar closes automatically after selection

### Active State Testing
- Navigate to different pages
- **Active page** shows cyan highlight and left border
- **Hover effect** on inactive items

### User Profile Card
- Located at top of sidebar
- Shows your initials in gradient avatar
- Displays your role
- Shows notification badge when you have unread notifications

### Conversation Management
- Click **"➕ New Conversation"** to start fresh chat
- **Recent conversations** shown below (last 10)
- Active conversation highlighted
- Click any conversation to switch

---

## Troubleshooting

### Issue: Backend won't start
**Error:** "Port 3000 is already in use"
**Solution:**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Restart backend
cd backend
npm run start:dev
```

### Issue: Frontend won't start
**Error:** "Port 8000 is already in use"
**Solution:**
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process
taskkill /PID <PID> /F

# Restart frontend
npm run dev
```

### Issue: API calls failing
**Error:** "Failed to fetch" or 404 errors
**Check:**
1. Backend running on port 3000? ✓
2. Frontend running on port 8000? ✓
3. Check browser console for proxy errors
4. Verify backend health: http://localhost:3000/health

### Issue: Sidebar not visible
**Solution:**
- Check browser console for React errors
- Ensure `isSidebarOpen` state is working
- Verify screen size (mobile behavior on small screens)
- Try clicking hamburger menu to toggle

### Issue: Navigation items missing
**Check:**
- User logged in? (Check localStorage for `caredroid_access_token`)
- User has proper permissions? (Team & Audit require RBAC permissions)
- Check browser console for permission errors

---

## Development Workflow

### Making Changes to Sidebar
1. Edit `src/components/Sidebar.jsx`
2. **Hot reload** automatically refreshes browser
3. Check browser console for errors
4. Test on both desktop and mobile sizes

### Adding New Navigation Item
```jsx
// In Sidebar.jsx, add to primaryNavItems array:
const primaryNavItems = [
  // ... existing items
  { 
    id: 'new-item', 
    label: 'New Feature', 
    path: '/new-feature', 
    icon: '🎯',
    description: 'Description here',
    permission: Permission.SOME_PERMISSION // Optional
  },
];
```

### Changing Sidebar Width
```jsx
// In Sidebar.jsx, change width from 320px to your desired size:
width: '280px', // or '360px', etc.
```

---

## Browser Compatibility

✅ **Tested On:**
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

⚠️ **Note:** Mobile webkit (iOS Safari) may require `-webkit-` prefixes for some CSS properties.

---

## Performance Tips

1. **Keep sidebar open on desktop** - Better UX, no animation lag
2. **Use keyboard shortcuts** - Plan for Cmd/Ctrl+K navigation
3. **Limit recent conversations** - Currently showing 10, expandable
4. **Lazy load** conversation content - Only load when selected

---

## Next Steps

✅ **Completed:**
- Sidebar navigation revamped
- All navigation migrated from header
- Mobile responsive design
- Permission-based rendering
- Active state indicators

📋 **Future Enhancements:**
- Keyboard navigation (Tab, Enter, Escape)
- Search bar in sidebar
- Pinned conversations
- Drag & drop conversation reordering
- Collapsible sections
- Themes (Dark/Light mode toggle)

---

## Support

For issues or questions:
1. Check [SIDEBAR_NAVIGATION.md](./SIDEBAR_NAVIGATION.md) for detailed documentation
2. Review browser console for errors
3. Check network tab for API call failures
4. Verify backend logs for server-side issues

---

**Happy Developing! 🎉**
