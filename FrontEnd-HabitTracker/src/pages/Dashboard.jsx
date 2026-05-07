import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import API from "../api/api";
import LoadingSpinner from "../components/LoadingSpinner";
import Navbar from "../components/Navbar";
import "../styles/dashboard.css";

const weekDayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDateKey(value) {
  return new Date(value).toISOString().split("T")[0];
}

function getLogStatus(log) {
  if (log.status) {
    return log.status;
  }

  return log.completed ? "completed" : "missed";
}

function getStatusLabel(status) {
  if (status === "completed") {
    return "Done today";
  }

  if (status === "skipped") {
    return "Skipped today";
  }

  if (status === "missed") {
    return "Missed today";
  }

  return "Pending";
}

function getMonthDays(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const leadingBlanks = firstDay.getDay();
  const days = [];

  for (let index = 0; index < leadingBlanks; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(year, month, day));
  }

  return days;
}

function buildSevenDayChart(logsMap) {
  const labels = [];
  const counts = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);

    const dateKey = getDateKey(date);
    labels.push(
      date.toLocaleDateString(undefined, {
        weekday: "short",
      }),
    );

    const completions = Object.values(logsMap).reduce((total, logs) => {
      return (
        total +
        logs.filter((log) => getLogStatus(log) === "completed" && log.date === dateKey)
          .length
      );
    }, 0);

    counts.push(completions);
  }

  return { labels, counts };
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

function Dashboard() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("habitTrackerTheme") === "true";
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [user, setUser] = useState(null);
  const [habits, setHabits] = useState([]);
  const [analyticsMap, setAnalyticsMap] = useState({});
  const [logsMap, setLogsMap] = useState({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [freezeCount, setFreezeCount] = useState(2);
  const [editHabitId, setEditHabitId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("General");
  const [editFreezeCount, setEditFreezeCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("streak");
  const [calendarHabitId, setCalendarHabitId] = useState("all");
  const [calendarDate, setCalendarDate] = useState(() => new Date());

  const loadDashboard = useCallback(async () => {
    try {
      const [userResponse, habitsResponse] = await Promise.all([
        API.get("/auth/me"),
        API.get("/habits"),
      ]);

      setUser(userResponse.data);
      setHabits(habitsResponse.data);

      const details = await Promise.all(
        habitsResponse.data.map(async (habit) => {
          const [analyticsResponse, logsResponse] = await Promise.all([
            API.get(`/analytics/streak/${habit.id}`),
            API.get(`/logs/${habit.id}`),
          ]);

          return {
            habitId: habit.id,
            analytics: analyticsResponse.data,
            logs: logsResponse.data,
          };
        }),
      );

      setAnalyticsMap(
        Object.fromEntries(details.map((item) => [item.habitId, item.analytics])),
      );
      setLogsMap(Object.fromEntries(details.map((item) => [item.habitId, item.logs])));
    } catch (error) {
      console.log(error);
      toast.error("Unable to load dashboard");
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/");
      return;
    }

    loadDashboard();
  }, [loadDashboard, navigate]);

  const toggleTheme = () => {
    const nextTheme = !darkMode;
    setDarkMode(nextTheme);
    localStorage.setItem("habitTrackerTheme", String(nextTheme));
  };

  const refreshDashboard = async () => {
    setIsRefreshing(true);

    try {
      await loadDashboard();
    } finally {
      setIsRefreshing(false);
    }
  };

  const resetEditState = () => {
    setEditHabitId(null);
    setEditTitle("");
    setEditDescription("");
    setEditCategory("General");
    setEditFreezeCount(0);
  };

  const createHabit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await API.post("/habits", {
        title,
        description,
        category,
        freeze_count: Number(freezeCount),
      });

      toast.success("Habit created");
      setTitle("");
      setDescription("");
      setCategory("General");
      setFreezeCount(2);
      await refreshDashboard();
    } catch (error) {
      console.log(error);
      toast.error("Failed to create habit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteHabit = async (habitId) => {
    try {
      await API.delete(`/habits/${habitId}`);
      toast.error("Habit deleted");
      await refreshDashboard();
    } catch (error) {
      console.log(error);
      toast.error("Failed to delete habit");
    }
  };

  const editHabit = async (habitId) => {
    try {
      await API.put(`/habits/${habitId}`, {
        title: editTitle,
        description: editDescription,
        category: editCategory,
        freeze_count: Number(editFreezeCount),
      });

      toast.success("Habit updated");
      resetEditState();
      await refreshDashboard();
    } catch (error) {
      console.log(error);
      toast.error("Failed to update habit");
    }
  };

  const logHabitStatus = async (habitId, status) => {
    try {
      await API.post(`/logs/${habitId}`, {
        status,
      });

      const messages = {
        completed: "Habit marked complete for today",
        skipped: "Habit skipped for today",
        missed: "Habit marked missed for today",
      };

      toast.success(messages[status] || "Habit updated");
      await refreshDashboard();
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.detail || "Unable to update habit log");
    }
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

  const habitCards = useMemo(() => {
    return habits
      .map((habit) => {
        const logs = logsMap[habit.id] || [];
        const analytics = analyticsMap[habit.id] || {};
        const todayKey = getDateKey(new Date());
        const todayLog = logs.find((log) => log.date === todayKey);
        const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
          const date = new Date();
          date.setHours(0, 0, 0, 0);
          date.setDate(date.getDate() - index);
          return getDateKey(date);
        });
        const weeklyCompletions = logs.filter(
          (log) =>
            getLogStatus(log) === "completed" && lastSevenDays.includes(log.date),
        ).length;
        const progressPercent = Math.min(
          Math.round((weeklyCompletions / 7) * 100),
          100,
        );
        const freezeUsed = logs.filter((log) => log.used_freeze).length;
        const todayStatus = todayLog ? getLogStatus(todayLog) : "pending";

        return {
          ...habit,
          logs,
          todayStatus,
          hasLoggedToday: Boolean(todayLog),
          weeklyCompletions,
          progressPercent,
          currentStreak: analytics.current_streak || 0,
          longestStreak: analytics.longest_streak || 0,
          totalLogs: analytics.total_logs || logs.length,
          freezeCount: analytics.freeze_count ?? habit.freeze_count ?? 0,
          freezeUsed,
        };
      })
      .filter((habit) => {
        const matchesSearch =
          habit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (habit.description || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (habit.category || "").toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) {
          return false;
        }

        if (categoryFilter !== "all" && habit.category !== categoryFilter) {
          return false;
        }

        if (statusFilter === "completed") {
          return habit.todayStatus === "completed";
        }

        if (statusFilter === "pending") {
          return habit.todayStatus === "pending";
        }

        if (statusFilter === "skipped") {
          return habit.todayStatus === "skipped";
        }

        if (statusFilter === "missed") {
          return habit.todayStatus === "missed";
        }

        if (statusFilter === "frozen") {
          return habit.freezeUsed > 0;
        }

        return true;
      })
      .sort((left, right) => {
        if (sortBy === "title") {
          return left.title.localeCompare(right.title);
        }

        if (sortBy === "newest") {
          return new Date(right.created_at) - new Date(left.created_at);
        }

        if (sortBy === "category") {
          return (left.category || "").localeCompare(right.category || "");
        }

        return right.currentStreak - left.currentStreak;
      });
  }, [analyticsMap, categoryFilter, habits, logsMap, searchTerm, sortBy, statusFilter]);

  const summaryStats = useMemo(() => {
    const chart = buildSevenDayChart(logsMap);
    const totalLogs = habitCards.reduce((total, habit) => total + habit.totalLogs, 0);
    const completionsToday = habitCards.filter(
      (habit) => habit.todayStatus === "completed",
    ).length;
    const bestStreak = habitCards.reduce(
      (best, habit) => Math.max(best, habit.longestStreak),
      0,
    );
    const weeklyProgress =
      habitCards.length === 0
        ? 0
        : Math.round(
            habitCards.reduce((total, habit) => total + habit.progressPercent, 0) /
              habitCards.length,
          );
    const totalFreezesLeft = habitCards.reduce(
      (total, habit) => total + (habit.freezeCount || 0),
      0,
    );

    return {
      chart,
      totalLogs,
      completionsToday,
      bestStreak,
      weeklyProgress,
      totalFreezesLeft,
    };
  }, [habitCards, logsMap]);

  const calendarSummary = useMemo(() => {
    const selectedLogs =
      calendarHabitId === "all"
        ? Object.values(logsMap).flat()
        : logsMap[Number(calendarHabitId)] || [];

    return selectedLogs.reduce((accumulator, log) => {
      const key = log.date;

      if (!accumulator[key]) {
        accumulator[key] = {
          completed: 0,
          skipped: 0,
          missed: 0,
        };
      }

      accumulator[key][getLogStatus(log)] += 1;
      return accumulator;
    }, {});
  }, [calendarHabitId, logsMap]);

  const availableCategories = useMemo(() => {
    return [...new Set(habits.map((habit) => habit.category || "General"))].sort();
  }, [habits]);

  const maxChartCount = Math.max(...summaryStats.chart.counts, 1);
  const monthDays = getMonthDays(calendarDate);

  if (isLoading) {
    return (
      <div className={`app-shell ${darkMode ? "theme-dark" : "theme-light"}`}>
        <div className="app-shell__inner">
          <LoadingSpinner label="Loading your dashboard..." />
        </div>
      </div>
    );
  }

  return (
    <div className={`app-shell ${darkMode ? "theme-dark" : "theme-light"}`}>
      <div className="app-shell__inner">
        <Navbar darkMode={darkMode} onToggleTheme={toggleTheme} />

        <section className="hero-card">
          <div>
            <p className="section-kicker">Dashboard</p>
            <h2>Welcome back, {user?.username || "tracker"}.</h2>
            <p className="muted-text">
              Track missed and skipped days, manage categories, and keep an eye on
              your remaining streak freezes.
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
            <button
              type="button"
              className="secondary-button"
              onClick={refreshDashboard}
              disabled={isRefreshing}
            >
              {isRefreshing ? "Refreshing..." : "Refresh data"}
            </button>
          </div>
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <span>Total habits</span>
            <strong>{habitCards.length}</strong>
          </article>
          <article className="stat-card">
            <span>Completed today</span>
            <strong>{summaryStats.completionsToday}</strong>
          </article>
          <article className="stat-card">
            <span>Best streak</span>
            <strong>{summaryStats.bestStreak} days</strong>
          </article>
          <article className="stat-card">
            <span>Freeze saves left</span>
            <strong>{summaryStats.totalFreezesLeft}</strong>
          </article>
        </section>

        <section className="content-grid">
          <article className="panel-card">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Create habit</p>
                <h3>Add a new routine</h3>
              </div>
            </div>

            <form className="habit-form" onSubmit={createHabit}>
              <input
                type="text"
                placeholder="Habit title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Habit description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
              <input
                type="text"
                placeholder="Category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              />
              <input
                type="number"
                min="0"
                placeholder="Freeze saves"
                value={freezeCount}
                onChange={(event) => setFreezeCount(event.target.value)}
              />
              <button
                type="submit"
                className="primary-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Create habit"}
              </button>
            </form>
          </article>

          <article className="panel-card">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Search and filters</p>
                <h3>Focus your list</h3>
              </div>
            </div>

            <div className="filters-grid filters-grid--wide">
              <input
                type="search"
                placeholder="Search by title, description, or category"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All habits</option>
                <option value="completed">Completed today</option>
                <option value="pending">Pending today</option>
                <option value="skipped">Skipped today</option>
                <option value="missed">Missed today</option>
                <option value="frozen">Used a freeze</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="all">All categories</option>
                {availableCategories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="streak">Sort by streak</option>
                <option value="title">Sort by title</option>
                <option value="newest">Sort by newest</option>
                <option value="category">Sort by category</option>
              </select>
            </div>
          </article>
        </section>

        <section className="content-grid">
          <article className="panel-card">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Charts dashboard</p>
                <h3>Last 7 days of completions</h3>
              </div>
            </div>

            <div className="bar-chart">
              {summaryStats.chart.labels.map((label, index) => (
                <div className="bar-chart__item" key={label}>
                  <span className="bar-chart__value">
                    {summaryStats.chart.counts[index]}
                  </span>
                  <div className="bar-chart__track">
                    <div
                      className="bar-chart__fill"
                      style={{
                        height: `${
                          (summaryStats.chart.counts[index] / maxChartCount) * 100
                        }%`,
                      }}
                    />
                  </div>
                  <span className="bar-chart__label">{label}</span>
                </div>
              ))}
            </div>

            <div className="chart-summary">
              <div>
                <span>Total logs</span>
                <strong>{summaryStats.totalLogs}</strong>
              </div>
              <div>
                <span>Today</span>
                <strong>{summaryStats.completionsToday}</strong>
              </div>
              <div>
                <span>Average weekly progress</span>
                <strong>{summaryStats.weeklyProgress}%</strong>
              </div>
            </div>
          </article>

          <article className="panel-card">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Calendar view</p>
                <h3>Monthly consistency</h3>
              </div>
            </div>

            <div className="calendar-toolbar">
              <button
                type="button"
                className="ghost-button"
                onClick={() =>
                  setCalendarDate(
                    (current) =>
                      new Date(current.getFullYear(), current.getMonth() - 1, 1),
                  )
                }
              >
                Previous
              </button>

              <strong>
                {calendarDate.toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </strong>

              <button
                type="button"
                className="ghost-button"
                onClick={() =>
                  setCalendarDate(
                    (current) =>
                      new Date(current.getFullYear(), current.getMonth() + 1, 1),
                  )
                }
              >
                Next
              </button>
            </div>

            <select
              value={calendarHabitId}
              onChange={(event) => setCalendarHabitId(event.target.value)}
            >
              <option value="all">All habits</option>
              {habits.map((habit) => (
                <option key={habit.id} value={habit.id}>
                  {habit.title}
                </option>
              ))}
            </select>

            <div className="calendar-grid calendar-grid--labels">
              {weekDayLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>

            <div className="calendar-grid">
              {monthDays.map((day, index) => {
                if (!day) {
                  return <div className="calendar-cell calendar-cell--empty" key={index} />;
                }

                const dateKey = getDateKey(day);
                const counts = calendarSummary[dateKey] || {
                  completed: 0,
                  skipped: 0,
                  missed: 0,
                };
                const isToday = dateKey === getDateKey(new Date());
                const cellClass =
                  counts.completed > 0
                    ? "is-complete"
                    : counts.skipped > 0
                      ? "is-skipped"
                      : counts.missed > 0
                        ? "is-missed"
                        : "";

                return (
                  <div
                    className={`calendar-cell ${cellClass} ${
                      isToday ? "is-today" : ""
                    }`}
                    key={dateKey}
                  >
                    <strong>{day.getDate()}</strong>
                    <span>
                      {counts.completed > 0
                        ? `${counts.completed} done`
                        : counts.skipped > 0
                          ? `${counts.skipped} skipped`
                          : counts.missed > 0
                            ? `${counts.missed} missed`
                            : "No logs"}
                    </span>
                  </div>
                );
              })}
            </div>
          </article>
        </section>

        <section className="habits-section">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Habit progress bars</p>
              <h3>Your habits</h3>
            </div>
          </div>

          {habitCards.length === 0 ? (
            <div className="panel-card">
              <p className="empty-state">
                No habits match your current filters. Try changing the search or
                create a new habit above.
              </p>
            </div>
          ) : (
            <div className="habit-grid">
              {habitCards.map((habit) => (
                <article className="habit-card" key={habit.id}>
                  <div className="habit-card__header">
                    <div>
                      <h4>{habit.title}</h4>
                      <p>{habit.description || "No description added yet."}</p>
                    </div>
                    <span className={`habit-status is-${habit.todayStatus}`}>
                      {getStatusLabel(habit.todayStatus)}
                    </span>
                  </div>

                  <div className="habit-tags">
                    <span className="habit-chip">Category: {habit.category || "General"}</span>
                    <span className="habit-chip">
                      Freeze saves left: {habit.freezeCount}
                    </span>
                    <span className="habit-chip">
                      Freeze saves used: {habit.freezeUsed}
                    </span>
                  </div>

                  <div className="habit-metrics">
                    <div>
                      <span>Current streak</span>
                      <strong>{habit.currentStreak} days</strong>
                    </div>
                    <div>
                      <span>Longest streak</span>
                      <strong>{habit.longestStreak} days</strong>
                    </div>
                    <div>
                      <span>Total logs</span>
                      <strong>{habit.totalLogs}</strong>
                    </div>
                  </div>

                  <div className="progress-block">
                    <div className="progress-block__meta">
                      <span>Weekly progress</span>
                      <strong>{habit.weeklyCompletions}/7 days</strong>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-bar__fill"
                        style={{ width: `${habit.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {editHabitId === habit.id ? (
                    <div className="edit-panel">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                      />
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(event) => setEditDescription(event.target.value)}
                      />
                      <input
                        type="text"
                        value={editCategory}
                        onChange={(event) => setEditCategory(event.target.value)}
                      />
                      <input
                        type="number"
                        min="0"
                        value={editFreezeCount}
                        onChange={(event) => setEditFreezeCount(event.target.value)}
                      />
                      <div className="habit-actions habit-actions--stacked">
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() => editHabit(habit.id)}
                        >
                          Save changes
                        </button>
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={resetEditState}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="habit-actions">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => {
                        setEditHabitId(habit.id);
                        setEditTitle(habit.title);
                        setEditDescription(habit.description || "");
                        setEditCategory(habit.category || "General");
                        setEditFreezeCount(habit.freezeCount || 0);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => logHabitStatus(habit.id, "completed")}
                      disabled={habit.hasLoggedToday}
                    >
                      Complete
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => logHabitStatus(habit.id, "skipped")}
                      disabled={habit.hasLoggedToday}
                    >
                      Skip
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => logHabitStatus(habit.id, "missed")}
                      disabled={habit.hasLoggedToday}
                    >
                      Miss
                    </button>
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => deleteHabit(habit.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
