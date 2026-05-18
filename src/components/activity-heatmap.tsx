"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { formatSwissDate, SWISS_MONTHS } from "@/lib/datetime";

export interface ActivityHeatmapProps {
  sessions: { created_at: string }[];
}

const EARLIEST_DATE = "2026-05-10";
const COLUMN_STRIDE = 16;
const MS_PER_DAY = 86_400_000;

const LABEL_CLASS =
  "font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500";

const DAY_LABELS = ["MON", "", "WED", "", "FRI", "", ""] as const;

const CELL_CLASS = "size-3 shrink-0 rounded-sm";

const TOOLTIP_CLASS =
  "pointer-events-none fixed z-50 -translate-x-1/2 whitespace-nowrap rounded-sm bg-black px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white dark:bg-white dark:text-black";

interface TooltipState {
  dateKey: string;
  date: Date;
  count: number;
  x: number;
  y: number;
}

interface HeatmapCell {
  dateKey: string;
  date: Date;
  count: number;
}

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function localDateFromIso(iso: string): Date {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

function mondayOnOrBefore(d: Date): Date {
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = monday.getDay();
  const delta = dow === 0 ? -6 : 1 - dow;
  monday.setDate(monday.getDate() + delta);
  return monday;
}

function intensityClass(count: number): string {
  if (count >= 4) return "bg-black dark:bg-white";
  if (count === 3) return "bg-gray-800 dark:bg-gray-200";
  if (count === 2) return "bg-gray-600 dark:bg-gray-400";
  if (count === 1) return "bg-gray-400 dark:bg-gray-500";
  return "bg-gray-100 dark:bg-gray-800";
}

function sessionLabel(count: number): string {
  if (count === 0) return "NO SESSIONS";
  if (count === 1) return "1 SESSION";
  return `${count} SESSIONS`;
}

export function ActivityHeatmap({ sessions }: ActivityHeatmapProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const { cells, gridStart, weekCount, currentWeekIndex } =
    useMemo(() => {
      const endDate = new Date();
      endDate.setHours(0, 0, 0, 0);

      const earliestApp = parseLocalDate(EARLIEST_DATE);
      let rangeStartDate = earliestApp;

      if (sessions.length > 0) {
        let firstSessionDate = localDateFromIso(sessions[0].created_at);
        for (const session of sessions) {
          const sessionDate = localDateFromIso(session.created_at);
          if (sessionDate < firstSessionDate) {
            firstSessionDate = sessionDate;
          }
        }
        if (firstSessionDate > earliestApp) {
          rangeStartDate = firstSessionDate;
        }
      }

      const gridStartDate = mondayOnOrBefore(rangeStartDate);
      const endRow = (endDate.getDay() + 6) % 7;
      const daysFromStart = Math.round(
        (endDate.getTime() - gridStartDate.getTime()) / MS_PER_DAY,
      );
      const weeks = Math.max(1, Math.floor((daysFromStart - endRow) / 7) + 1);
      const totalCells = weeks * 7;

      const countByDate = new Map<string, number>();
      for (const session of sessions) {
        const d = new Date(session.created_at);
        const key = localDateKey(d);
        countByDate.set(key, (countByDate.get(key) ?? 0) + 1);
      }

      const built: HeatmapCell[] = [];
      for (let i = 0; i < totalCells; i++) {
        const date = addDays(gridStartDate, i);
        const dateKey = localDateKey(date);
        const inRange = date >= rangeStartDate && date <= endDate;
        built.push({
          dateKey,
          date,
          count: inRange ? (countByDate.get(dateKey) ?? 0) : 0,
        });
      }

      const todayWeekIndex = Math.floor((daysFromStart - endRow) / 7);

      return {
        cells: built,
        gridStart: gridStartDate,
        weekCount: weeks,
        currentWeekIndex: todayWeekIndex,
      };
    }, [sessions]);

  const monthLabels = useMemo(() => {
    const labels: { col: number; label: string }[] = [];
    let lastMonth = -1;

    for (let col = 0; col < weekCount; col++) {
      const weekMonday = addDays(gridStart, col * 7);
      const month = weekMonday.getMonth();
      if (month !== lastMonth) {
        labels.push({ col, label: SWISS_MONTHS[month] });
        lastMonth = month;
      }
    }

    return labels;
  }, [gridStart, weekCount]);

  const activeTooltipKey = selectedCell ?? hoveredDate;

  const positionTooltip = (dateKey: string) => {
    const cell = cells.find((c) => c.dateKey === dateKey);
    const el = cellRefs.current.get(dateKey);
    if (!cell || !el) {
      setTooltip(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    setTooltip({
      dateKey: cell.dateKey,
      date: cell.date,
      count: cell.count,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  };

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollTarget =
      currentWeekIndex * COLUMN_STRIDE - container.clientWidth / 2;
    container.scrollLeft = Math.max(0, scrollTarget);
  }, [weekCount, currentWeekIndex]);

  useLayoutEffect(() => {
    if (!activeTooltipKey) {
      setTooltip(null);
      return;
    }
    positionTooltip(activeTooltipKey);
  }, [activeTooltipKey, cells]);

  useEffect(() => {
    if (!activeTooltipKey) return;

    const container = scrollRef.current;
    if (!container) return;

    const onScroll = () => positionTooltip(activeTooltipKey);
    container.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      container.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [activeTooltipKey, cells]);

  useEffect(() => {
    if (!selectedCell) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (scrollRef.current?.contains(target)) return;
      setSelectedCell(null);
      setHoveredDate(null);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [selectedCell]);

  return (
    <section>
      <p className={`${LABEL_CLASS} mb-2`}>Activity</p>
      <div className="w-full overflow-hidden rounded-sm border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-black">
        <div ref={scrollRef} className="overflow-x-auto">
          <div className="min-w-max">
            <div className="flex">
              <div className="w-8 shrink-0">
                <div className="mb-1 h-4" aria-hidden />
                <div className="grid grid-rows-7 gap-1">
                  {DAY_LABELS.map((label, row) => (
                    <div
                      key={row}
                      className={`${LABEL_CLASS} flex h-3 items-center`}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div
                  className="relative mb-1 h-4"
                  style={{ width: weekCount * COLUMN_STRIDE - 4 }}
                >
                  {monthLabels.map(({ col, label }) => (
                    <span
                      key={`${col}-${label}`}
                      className={`${LABEL_CLASS} absolute top-0`}
                      style={{ left: col * COLUMN_STRIDE }}
                    >
                      {label}
                    </span>
                  ))}
                </div>

                <div className="grid grid-flow-col grid-rows-7 gap-1">
                  {cells.map((cell) => (
                    <button
                      key={cell.dateKey}
                      ref={(el) => {
                        if (el) cellRefs.current.set(cell.dateKey, el);
                        else cellRefs.current.delete(cell.dateKey);
                      }}
                      type="button"
                      className={`${CELL_CLASS} ${intensityClass(cell.count)}`}
                      aria-label={`${formatSwissDate(cell.date)}, ${sessionLabel(cell.count)}`}
                      onMouseEnter={(event) => {
                        setHoveredDate(cell.dateKey);
                        const rect = event.currentTarget.getBoundingClientRect();
                        setTooltip({
                          dateKey: cell.dateKey,
                          date: cell.date,
                          count: cell.count,
                          x: rect.left + rect.width / 2,
                          y: rect.top - 8,
                        });
                      }}
                      onMouseLeave={() => {
                        setHoveredDate(null);
                        if (!selectedCell) setTooltip(null);
                      }}
                      onClick={(event) => {
                        setSelectedCell((current) => {
                          const next =
                            current === cell.dateKey ? null : cell.dateKey;
                          if (next) {
                            const rect =
                              event.currentTarget.getBoundingClientRect();
                            setTooltip({
                              dateKey: cell.dateKey,
                              date: cell.date,
                              count: cell.count,
                              x: rect.left + rect.width / 2,
                              y: rect.top - 8,
                            });
                          } else {
                            setTooltip(null);
                          }
                          return next;
                        });
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <span className={LABEL_CLASS}>Less</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`${CELL_CLASS} ${intensityClass(level)}`}
                    aria-hidden
                  />
                ))}
              </div>
              <span className={LABEL_CLASS}>More</span>
            </div>
          </div>
        </div>

        {tooltip && (
          <div
            role="tooltip"
            className={TOOLTIP_CLASS}
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            {formatSwissDate(tooltip.date)} · {sessionLabel(tooltip.count)}
          </div>
        )}
      </div>
    </section>
  );
}
