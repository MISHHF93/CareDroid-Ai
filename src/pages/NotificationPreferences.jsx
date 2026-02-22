import { useUser } from '../contexts/UserContext';
import AppShell from '../layout/AppShell';
import NotificationPreferencesView from '../components/NotificationPreferences';

const NotificationPreferences = () => {
  const { signOut } = useUser();

  return (
    <AppShell
      isAuthed={true}
      conversations={[]}
      activeConversation={null}
      onSelectConversation={() => {}}
      onNewConversation={() => {}}
      onSignOut={signOut}
      healthStatus="online"
    >
      <NotificationPreferencesView />
    </AppShell>
  );
};

export default NotificationPreferences;
