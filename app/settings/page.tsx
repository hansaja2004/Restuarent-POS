import Sidebar from '@/components/sidebar';
import SettingsClient from '@/components/settings-client';
import { getSession } from '@/lib/auth';
import { getUsers } from '@/app/actions/employees';
import { getServerConfig } from '@/app/actions/settings';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const [users, serverConfig] = await Promise.all([
    getUsers(),
    getServerConfig(),
  ]);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar role={session.role} />
      <div className="flex-1 overflow-y-auto">
        <SettingsClient
          session={session}
          initialUsers={users}
          serverConfig={serverConfig}
        />
      </div>
    </div>
  );
}
