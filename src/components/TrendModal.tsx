import React, { useState, useEffect, useCallback } from 'react';
// import Chart from 'chart.js/auto';
import { Chart, CategoryScale, LinearScale, LineElement, LineController, PointElement, Tooltip } from 'chart.js';
Chart.register(CategoryScale, LinearScale, LineElement, LineController, PointElement, Tooltip);


import { calculateAndNormalizeKeys, toFloat } from '../utils/helpers';
import { HOST, historicalTitles } from '../utils/constants';
import { typeExtendedReport, typeTitles } from '../types/types';

interface TrendModalProps {
    clientId: number;
    onClose: (E: React.MouseEvent) => void;
}

const TrendModal: React.FC<TrendModalProps> = ({ clientId, onClose }) => {
    const [apiData, setApiData] = useState<any[] | null>(null);
    const [chartData, setChartData] = useState<any>(null);
    const [dataLevel, setDataLevel] = useState('seconds');
    const [selectedKeys, setSelectedKeys] = useState<string[] | null>(null);
    const [availableKeys, setAvailableKeys] = useState<string[]>([]);

    const dataLevelOptions = [
        { value: 'seconds', label: '最近一小时', title: '10秒递进' },
        { value: 'minutes', label: '最近一天', title: '60秒递进' },
        { value: 'hours', label: '最近一年', title: '60分钟递进' },
    ];


    const calculateUsedMemParcent = (current: Partial<typeExtendedReport>) => {
        // 计算内存的真实占用，实际上 Linux 内存占用 = 内存总量 - 空闲内存 - 缓冲区 - 缓存区
        // 其实 current.mem_buff_cache_mib 也是真正占用了内存的，只是并不是真正的用户态程序占用的
        current.mem_really_used_mib = (current.mem_total_mib! - (current.mem_free_mib! + current.mem_buff_cache_mib!));
        current.mem_used_total_percent = toFloat(current.mem_really_used_mib / current.mem_total_mib!)
        return current;
    };


    const fetchHistoryData = useCallback(async () => {
        try {
            const endpoint = `/status/${dataLevel}?client_id=${clientId}`;
            const response = await fetch(`${HOST}${endpoint}`);

            const data = (await response.json() as Partial<typeExtendedReport>[]).reverse();

            data.map((item: Partial<typeExtendedReport>) => calculateAndNormalizeKeys(item, ["cpu_user", "cpu_system", "cpu_nice", "cpu_idle", "cpu_iowait", "cpu_irq", "cpu_softirq", "cpu_steal"]));
            data.map((item: Partial<typeExtendedReport>) => calculateUsedMemParcent(item));

            setApiData(data);

            if (data && data.length > 0) {
                const keys = Object.keys(data[0]).filter(
                    (key) => key !== 'client_id' && key !== 'timestamp' && historicalTitles.hasOwnProperty(key)
                );
                setAvailableKeys(keys);
                if (!selectedKeys) {
                    setSelectedKeys(['load_1min']);
                } else {
                    setSelectedKeys(JSON.parse(JSON.stringify(selectedKeys)));
                }
            }

        } catch (error) {
            console.error('Error fetching history data:', error);
        }
    }, [clientId, dataLevel]);

    useEffect(() => {
        fetchHistoryData();
    }, [fetchHistoryData]);

    const handleDataLevelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setDataLevel(event.target.value);
    };

    const handleSelectedKeysChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = Array.from(event.target.selectedOptions, (option) => option.value);
        setSelectedKeys(selected);
    };

    useEffect(() => {
        if (apiData && apiData.length > 0) {


            function formatTimestamp(timestamp: number) {
                const now = Date.now(); // 当前时间戳（毫秒）
                const targetTime = timestamp; // 将秒级时间戳转换为毫秒
                const diff = now - targetTime; // 时间差（毫秒）

                const seconds = toFloat(diff / 1000); // 转换为秒
                const minutes = toFloat(seconds / 60); // 转换为分钟
                const hours = toFloat(minutes / 60); // 转换为小时
                const days = toFloat(hours / 24); // 转换为天

                if (seconds < 3600) {
                    // 距离现在小于1小时，格式化为 *s
                    return `-${seconds}s`;
                } else if (hours < 24) {
                    // 距离现在1-24小时，格式化为 *h
                    return `-${hours}h`;
                } else {
                    // 距离现在超过24小时，格式化为 *d
                    return `-${days}d`;
                }
            }

            // 处理数据，生成 Chart.js 所需的格式
            const labels = apiData.map((item) => formatTimestamp(item.timestamp * 1000));


            const CHART_COLORS = {
                red: 'rgba(255, 99, 132, 0.8)',
                orange: 'rgba(255, 159, 64, 0.8)',
                yellow: 'rgba(255, 205, 86, 0.8)',
                green: 'rgba(75, 192, 192, 0.8)',
                blue: 'rgba(54, 162, 235, 0.8)',
                purple: 'rgba(153, 102, 255, 0.8)',
            };

            const datasets = selectedKeys?.map((key, index) => ({
                label: key,
                data: apiData.map((item) => item[key]),
                borderColor: Object.values(CHART_COLORS)[index % Object.keys(CHART_COLORS).length],
                fill: false,
                pointStyle: false,
                borderWidth: 1,
            }));

            console.log('datasets', datasets)

            setChartData({ labels, datasets });
        }
    }, [selectedKeys]);

    useEffect(() => {
        if (chartData) {
            const ctx = (document.getElementById('trendChart') as HTMLCanvasElement)?.getContext('2d');
            if (ctx) {
                const chart = new Chart(ctx, {
                    type: 'line',
                    data: chartData,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                ticks: {
                                    maxTicksLimit: 5,
                                    autoSkip: true,
                                    font: { size: 10 },
                                },
                                grid: { display: false },
                            },
                            y: {
                                ticks: {
                                    maxTicksLimit: 5,
                                    font: { size: 10 },
                                    callback: (value) => {
                                        if (!value) {
                                            return null
                                        }
                                        const inputValue = value as number
                                        const unit = historicalTitles[chartData.datasets[0].label as keyof typeTitles]![1];
                                        let tempValue = '0';
                                        if (inputValue > 10) {
                                            if (inputValue > 1000) {
                                                tempValue = Number(inputValue.toFixed(0)).toLocaleString();
                                            } else {
                                                tempValue = inputValue.toFixed(0);
                                            }
                                        } else {
                                            tempValue = inputValue.toFixed(2);
                                        }
                                        return `${tempValue}${unit}`;
                                    },
                                },
                                grid: { display: true },
                            },
                        },
                        plugins: {
                            legend: { display: false },
                            tooltip: { enabled: true, mode: 'index', intersect: false },
                        },
                    },
                });

                return () => chart.destroy();
            }
        }
    }, [chartData]);

    return (
        <div className="fixed inset-0 bg-model flex items-center justify-center p-4"
            onClick={onClose}>
            <div className="bg-white rounded-lg p-2 py-4 w-full max-w-4xl"
                onClick={(e) => e.stopPropagation()}
            >

                <div className="felx items-center justify-between ">
                    <div className='grid-container'>
                        <select
                            value={dataLevel}
                            onChange={handleDataLevelChange}
                            className="text-sm w-auto p-2 rounded outline-none shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]"
                        >
                            {dataLevelOptions.map((option) => (
                                <option key={option.value} value={option.value} title={option.title}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {availableKeys.length > 0 && (
                            <select
                                multiple={false}
                                value={selectedKeys || []}
                                onChange={handleSelectedKeysChange}
                                className="text-sm w-auto p-2 rounded outline-none shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]"
                            >
                                {availableKeys.map((key) => (
                                    <option key={key} value={key} title={historicalTitles[key as keyof typeTitles]![2]}>
                                        {historicalTitles[key as keyof typeTitles]![0]}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                <div className="relative mt-2 p-2 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]" style={{ minHeight: '350px' }}>
                    <canvas id="trendChart"></canvas>
                </div>
            </div>
        </div>
    );
};

export default TrendModal;