const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zkhudonnukctvrxreekk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpraHVkb25udWtjdHZyeHJlZWtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNjU2MDQsImV4cCI6MjA4MDc0MTYwNH0.Gww86GWMJzasaiI3b0S33VOmpz3yjwe7XF0MLWc1nVw'
);

async function test() {
  console.log('Fetching data...');
  try {
    const { data: viewingPasses } = await supabase.from('viewing_passes').select('*');
    const { data: viewingHistory } = await supabase.from('viewing_history').select('*');
    const { data: premiumApplications } = await supabase.from('premium_applications').select('*');

    console.log('viewingPasses Count:', viewingPasses?.length);
    console.log('viewingHistory Count:', viewingHistory?.length);
    console.log('premiumApplications Count:', premiumApplications?.length);

    console.log('--- Pass Stats calculation ---');
    const totalRemainingPasses = (viewingPasses || []).reduce((sum, p) => sum + (p.remaining_count || 0), 0);
    const totalDistributedPasses = (viewingPasses || []).reduce((sum, p) => sum + (p.total_count || 0), 0);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayUsage = (viewingHistory || []).filter(h => h.viewed_at && h.viewed_at.startsWith(todayStr)).length;

    console.log('passesByType reduce...');
    const passesByType = (viewingPasses || []).reduce((acc, p) => {
      const type = p.package_type || 'regular';
      acc[type] = (acc[type] || 0) + (p.remaining_count || 0);
      return acc;
    }, {});

    console.log('dailyHistoryStats reduce...');
    const dailyHistoryStats = (viewingHistory || []).reduce((acc, h) => {
      if (!h.viewed_at) return acc;
      const d = h.viewed_at.split('T')[0];
      if (!acc[d]) acc[d] = { total: 0, welcome: 0, admin: 0, paid: 0 };
      acc[d].total += 1;
      if (h.package_type === 'welcome_free') acc[d].welcome += 1;
      else if (h.package_type === 'admin_grant') acc[d].admin += 1;
      else acc[d].paid += 1;
      return acc;
    }, {});

    console.log('Passes stats success!');

    const activePremiums = (premiumApplications || []).filter(app => {
      return app.status === 'active' && app.end_date && new Date(app.end_date) > new Date();
    });

    console.log('All calculations successful!');
  } catch (err) {
    console.error('CRASH DETECTED:', err);
  }
}

test();
