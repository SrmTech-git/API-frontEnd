import SummaryStatsCard from '../components/SummaryStatsCard';
import TagUsageList from '../components/TagUsageList';
import './Dashboard.css';

function Dashboard() {
  return (
    <div className="page-container">
      <h1>Dashboard</h1>
      <div className="dashboard-container">
        <SummaryStatsCard />
        <TagUsageList />
      </div>
    </div>
  )
}

export default Dashboard
