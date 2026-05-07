from sqlalchemy import inspect, text


def sync_schema(engine):
    inspector = inspect(engine)

    if "habits" in inspector.get_table_names():
        habit_columns = {column["name"] for column in inspector.get_columns("habits")}

        with engine.begin() as connection:
            if "category" not in habit_columns:
                connection.execute(
                    text(
                        """
                        ALTER TABLE habits
                        ADD COLUMN category VARCHAR NOT NULL DEFAULT 'General'
                        """
                    )
                )

            if "freeze_count" not in habit_columns:
                connection.execute(
                    text(
                        """
                        ALTER TABLE habits
                        ADD COLUMN freeze_count INTEGER NOT NULL DEFAULT 2
                        """
                    )
                )

    if "habit_logs" in inspector.get_table_names():
        log_columns = {column["name"] for column in inspector.get_columns("habit_logs")}

        with engine.begin() as connection:
            if "status" not in log_columns:
                connection.execute(
                    text(
                        """
                        ALTER TABLE habit_logs
                        ADD COLUMN status VARCHAR NOT NULL DEFAULT 'completed'
                        """
                    )
                )
                connection.execute(
                    text(
                        """
                        UPDATE habit_logs
                        SET status = CASE
                            WHEN completed = TRUE THEN 'completed'
                            ELSE 'missed'
                        END
                        """
                    )
                )

            if "used_freeze" not in log_columns:
                connection.execute(
                    text(
                        """
                        ALTER TABLE habit_logs
                        ADD COLUMN used_freeze BOOLEAN NOT NULL DEFAULT FALSE
                        """
                    )
                )
