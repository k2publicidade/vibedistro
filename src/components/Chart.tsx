"use client";

interface LineChartProps {
    data: { date: string; value: number }[];
    height?: number;
    color?: string;
}

export function LineChart({ data, height = 200, color = '#FF5722' }: LineChartProps) {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((d.value - minValue) / range) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="w-full" style={{ height }}>
            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                {/* Grid lines */}
                <line x1="0" y1="25" x2="100" y2="25" stroke="#374151" strokeWidth="0.2" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="#374151" strokeWidth="0.2" />
                <line x1="0" y1="75" x2="100" y2="75" stroke="#374151" strokeWidth="0.2" />

                {/* Gradient fill */}
                <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Area under the line */}
                <polygon
                    points={`0,100 ${points} 100,100`}
                    fill="url(#lineGradient)"
                />

                {/* Line */}
                <polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
        </div>
    );
}

interface BarChartProps {
    data: { label: string; value: number; color?: string }[];
    height?: number;
}

export function BarChart({ data, height = 300 }: BarChartProps) {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map(d => d.value));

    return (
        <div className="w-full" style={{ height }}>
            <div className="flex items-end justify-between h-full gap-2">
                {data.map((item, index) => {
                    const barHeight = (item.value / maxValue) * 100;
                    return (
                        <div key={index} className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full flex items-end h-full">
                                <div
                                    className="w-full rounded-t-md transition-all hover:opacity-80"
                                    style={{
                                        height: `${barHeight}%`,
                                        backgroundColor: item.color || '#FF5722',
                                    }}
                                />
                            </div>
                            <span className="text-xs text-gray-400 text-center truncate w-full">
                                {item.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

interface PieChartProps {
    data: { label: string; value: number; color: string }[];
    size?: number;
}

export function PieChart({ data, size = 200 }: PieChartProps) {
    if (!data || data.length === 0) return null;

    const total = data.reduce((sum, d) => sum + d.value, 0);
    let currentAngle = -90;

    const slices = data.map((item) => {
        const percentage = (item.value / total) * 100;
        const angle = (percentage / 100) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        currentAngle = endAngle;

        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const x1 = 50 + 40 * Math.cos(startRad);
        const y1 = 50 + 40 * Math.sin(startRad);
        const x2 = 50 + 40 * Math.cos(endRad);
        const y2 = 50 + 40 * Math.sin(endRad);

        const largeArc = angle > 180 ? 1 : 0;

        const path = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;

        return { ...item, path, percentage };
    });

    return (
        <div className="flex items-center gap-6">
            <svg width={size} height={size} viewBox="0 0 100 100">
                {slices.map((slice, index) => (
                    <path
                        key={index}
                        d={slice.path}
                        fill={slice.color}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                ))}
            </svg>
            <div className="space-y-2">
                {slices.map((slice, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-sm"
                            style={{ backgroundColor: slice.color }}
                        />
                        <span className="text-sm text-gray-400">
                            {slice.label} ({slice.percentage.toFixed(1)}%)
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
