import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import API from "../api/api";
import LoadingSpinner from "../components/LoadingSpinner";
import Navbar from "../components/Navbar";
import "../styles/dashboard.css";

function getActivityLabel(item) {
  if (item.status === "completed") {
    return `Completed ${item.habit_title}`;
  }

  if (item.status === "skipped") {
    return `Skipped ${item.habit_title}`;
  }

  return item.used_freeze
    ? `Missed ${item.habit_title} but used a freeze`
    : `Missed ${item.habit_title}`;
}

function downloadBlob(blob) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "momentum-report.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

function Profile() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("habitTrackerTheme") === "true";
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/");
    }
  }, [navigate]);

  const loadProfile = useCallback(async () => {
    try {
      const response = await API.get("/analytics/profile");
      setProfileData(response.data);
    } catch (error) {
      console.log(error);
      toast.error("Unable to load profile");
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const toggleTheme = () => {
    const nextTheme = !darkMode;
    setDarkMode(nextTheme);
    localStorage.setItem("habitTrackerTheme", String(nextTheme));
  };

  const exportReport = async () => {
    setIsExporting(true);

    try {
      const response = await API.get("/analytics/report", {
        responseType: "blob",
      });
      downloadBlob(response.data);
      toast.success("Report downloaded");
    } catch (error) {
      console.log(error);
      toast.error("Unable to export report");
    } finally {
      setIsExporting(false);
    }
  };

  const topHabits = useMemo(() => {
    return [...(profileData?.habits || [])]
      .sort((left, right) => right.longest_streak - left.longest_streak)
      .slice(0, 4);
  }, [profileData]);

  if (isLoading) {
    return (
      <div className={`app-shell ${darkMode ? "theme-dark" : "theme-light"}`}>
        <div className="app-shell__inner">
          <LoadingSpinner label="Loading your profile..." />
        </div>
      </div>
    );
  }

  const user = profileData?.user;
  const summary = profileData?.summary;
  const categories = profileData?.category_breakdown || [];
  const recentActivity = profileData?.recent_activity || [];

  return (
    <div className={`app-shell ${darkMode ? "theme-dark" : "theme-light"}`}>
      <div className="app-shell__inner">
        <Navbar darkMode={darkMode} onToggleTheme={toggleTheme} />

        <section className="hero-card profile-hero">
          <div>
            <p className="section-kicker">Account overview</p>
            <h2>{user?.username || "Habit champion"}</h2>
            <p className="muted-text">
              Review your category mix, freeze saves, strong streaks, and export a
              progress report whenever you need it.
            </p>
          </div>
          <div className="hero-actions">
            <button
              type="button"
              className="ghost-button"
              onClick={exportReport}
              disabled={isExporting}
            >
              {isExporting ? "Exporting..." : "Export report"}
            </button>
            <div className="profile-avatar">
              {(user?.username || "U").slice(0, 1).toUpperCase()}
            </div>
          </div>
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <span>Total habits</span>
            <strong>{summary?.total_habits || 0}</strong>
          </article>
          <article className="stat-card">
            <span>Best streak</span>
            <strong>{summary?.best_streak || 0} days</strong>
          </article>
          <article className="stat-card">
            <span>Freeze saves used</span>
            <strong>{summary?.freeze_saves_used || 0}</strong>
          </article>
          <article className="stat-card">
            <span>Freeze saves left</span>
            <strong>{summary?.freeze_saves_left || 0}</strong>
          </article>
        </section>

        <section className="content-grid">
          <article className="panel-card">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Profile</p>
                <h3>Personal details</h3>
              </div>
            </div>

            <div className="profile-details">
              <div>
                <span>Username</span>
                <strong>{user?.username}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{user?.email}</strong>
              </div>
              <div>
                <span>Active streaks</span>
                <strong>{summary?.active_streaks || 0}</strong>
              </div>
              <div>
                <span>Missed logs</span>
                <strong>{summary?.missed_logs || 0}</strong>
              </div>
              <div>
                <span>Skipped logs</span>
                <strong>{summary?.skipped_logs || 0}</strong>
              </div>
              <div>
                <span>Completed logs</span>
                <strong>{summary?.completed_logs || 0}</strong>
              </div>
            </div>
          </article>

          <article className="panel-card">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Categories</p>
                <h3>Habit mix</h3>
              </div>
            </div>

            {categories.length === 0 ? (
              <p className="empty-state">No categories yet. Create habits to see your mix.</p>
            ) : (
              <div className="category-list">
                {categories.map((item) => (
                  <div className="category-item" key={item.category}>
                    <strong>{item.category}</strong>
                    <span>{item.count} habits</span>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="content-grid">
          <article className="panel-card">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Highlights</p>
                <h3>Top streak habits</h3>
              </div>
            </div>

            {topHabits.length === 0 ? (
              <p className="empty-state">No habit history yet. Start logging progress.</p>
            ) : (
              <div className="highlight-list">
                {topHabits.map((habit) => (
                  <div className="highlight-item" key={habit.id}>
                    <div>
                      <strong>{habit.title}</strong>
                      <p>{habit.category}</p>
                    </div>
                    <div className="highlight-item__stats">
                      <span>{habit.longest_streak} day best</span>
                      <span>{habit.freeze_count} freezes left</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="panel-card">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Activity</p>
                <h3>Recent status updates</h3>
              </div>
            </div>

            {recentActivity.length === 0 ? (
              <p className="empty-state">
                No logs yet. Head back to the dashboard and update today&apos;s habits.
              </p>
            ) : (
              <div className="activity-list">
                {recentActivity.map((item) => (
                  <div className="activity-item" key={item.id}>
                    <div className={`activity-item__dot is-${item.status}`} />
                    <div>
                      <strong>{new Date(item.date).toLocaleDateString()}</strong>
                      <p>{getActivityLabel(item)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      </div>
    </div>
  );
}

export default Profile;
