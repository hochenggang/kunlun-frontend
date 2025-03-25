import './App.css'

import { typeRawReport, typeExtendedReport, typeTitles } from './types/types';
import { generateEnhancedReport, isOutdated } from './utils/helpers';
import { TITLES, HOST } from './utils/constants';
import Server from './components/Server';

import React, { useState, useReducer, useCallback, useEffect, useRef } from 'react';


const App: React.FC = () => {
    const [servers, setServers] = useState<typeExtendedReport[]>([]);
    const [expandedStates, dispatch] = useReducer(expandedStatesReducer, {});
    const [showFieldSelector, setShowFieldSelector] = useState(false);
    const [selectedFields, setSelectedFields] = useState<(keyof Partial<typeTitles>)[]>(() => {
        const savedFields = localStorage.getItem('selectedFields');
        return savedFields ? JSON.parse(savedFields) : ['hostname', 'load_averages_info', 'memory_usage_el'];
    });

    const previousReportsRef = useRef<{ [key: string]: typeRawReport }>({});

    const renderServers = useRef<{ [key: string]: typeExtendedReport }>({});


    const fetchData = useCallback(async () => {
        try {
            // 从后端拉取客户端最新上报的状态 typeRawReport[]
            const response = await fetch(`${HOST}/status/latest`);
            const currentReportList: typeRawReport[] = await response.json();

            // 将所有的原始报告重新计算为用于展现的数据
            currentReportList.forEach(currentReport => {
                // console.log(currentReport);
                const previousReport = previousReportsRef.current[currentReport.machine_id] || null;
                // 进行数据重复判断，如果数据重复，则不进行更新
                if (JSON.stringify(currentReport) === JSON.stringify(previousReport)) {
                    return;
                } else {
                    previousReportsRef.current[currentReport.machine_id] = currentReport;
                }
                renderServers.current[currentReport.machine_id] = generateEnhancedReport(currentReport, previousReport);
            });

            setServers(Object.values(renderServers.current));

        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }, []);


    useEffect(() => {
        // 轮询拉取数据
        fetchData();
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, [fetchData]);



    const toggleExpand = useCallback((machineId: string) => {
        dispatch({ type: 'TOGGLE', machineId });
    }, []);


    const handleFieldSelection = (key: keyof typeTitles) => {
        let newSelectedFields: (keyof typeTitles)[];
        if (selectedFields.includes(key)) {
            newSelectedFields = selectedFields.filter(field => field !== key);
        } else {
            newSelectedFields = [...selectedFields, key];
        }
        setSelectedFields(newSelectedFields);
        localStorage.setItem('selectedFields', JSON.stringify(newSelectedFields));
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <h1 className="text-xl font-bold mb-4 text-center">Kunlun Monitor</h1>
            <div className="space-y-2">
                <div className="p-3 py-0 cursor-pointer rounded-lg transition-colors flex items-center justify-between text-sm">
                    <p>{servers.length > 0 ? `Online ${servers.filter(server => !isOutdated(server.timestamp)).length}/${servers.length}` : 'Loading...'}</p>
                    <button
                        className="p-1 text-gray-500 hover:text-gray-700"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowFieldSelector(true);
                        }}
                    >
                        <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="20" height="20" style={{
                            cursor: "pointer"
                        }}><path d="M979.116631 297.733128L526.434958 4.271987c-8.758974-5.700983-20.109941-5.700983-28.868916 0L44.883369 297.733128a26.549922 26.549922 0 0 0-12.102965 22.260935 26.548922 26.548922 0 0 0 12.102965 22.260934l452.682673 293.460141c4.379987 2.850992 9.406972 4.274987 14.434958 4.274987s10.054971-1.424996 14.434958-4.274987L979.118631 342.254997a26.547922 26.547922 0 0 0 12.102965-22.260934 26.553922 26.553922 0 0 0-12.104965-22.260935z" fill="#8DB0FC" p-id="9942"></path><path d="M512 581.838295L108.089183 319.994063 512 58.14983l403.910817 261.844233z" fill="#FFFFFF" p-id="9943"></path><path d="M512 829.740569a26.449923 26.449923 0 0 1-14.434958-4.274987L44.883369 532.004441c-12.309964-7.955977-15.808954-24.385929-7.825978-36.694892 7.954977-12.257964 24.385929-15.859954 36.694893-7.826977L512 771.587739l438.247716-284.105167c12.283964-8.032976 28.713916-4.430987 36.694893 7.826977 7.981977 12.309964 4.482987 28.738916-7.825978 36.694892L526.434958 825.465582A26.449923 26.449923 0 0 1 512 829.740569z" fill="#333333" p-id="9944"></path><path d="M512 1024a26.449923 26.449923 0 0 1-14.434958-4.275987L44.883369 726.262872c-12.309964-7.955977-15.808954-24.385929-7.825978-36.694892 7.954977-12.309964 24.385929-15.833954 36.694893-7.825977L512 965.84717l438.247716-284.105167c12.283964-8.007977 28.713916-4.482987 36.694893 7.825977 7.981977 12.309964 4.482987 28.738916-7.825978 36.694892l-452.682673 293.461141a26.444923 26.444923 0 0 1-14.433958 4.275987z" fill="#333333" ></path></svg>
                    </button>
                </div>
                {servers.map(server => (
                    <Server
                        key={server.machine_id}
                        server={server}
                        isExpanded={expandedStates[server.machine_id] || false}
                        onToggleExpand={() => toggleExpand(server.machine_id)}
                        selectedFields={selectedFields}
                    />
                ))}
            </div>
            {showFieldSelector && (
                <div className="fixed inset-0 bg-model  flex items-center justify-center"
                    onClick={() => setShowFieldSelector(false)}
                >
                    <div className="bg-white p-4 rounded-lg shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="py-2">选择优先显示字段</div>
                        <div className="grid grid-cols-3 gap-2 p-1">
                            {Object.keys(TITLES).map((key) => (
                                <label key={key} className="flex items-center text-gray-400 text-xs">
                                    <input
                                        type="checkbox"
                                        checked={selectedFields.includes(key as keyof typeTitles)}
                                        onChange={() => handleFieldSelection(key as keyof typeTitles)}
                                    />
                                    <span className="ml-2">{TITLES[key as keyof typeTitles]![0]}</span>
                                </label>
                            ))}
                        </div>
                        <button
                            className="mt-4 py-2 px-4 text-xs inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20"
                            onClick={() => setShowFieldSelector(false)}
                        >
                            确认
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const expandedStatesReducer = (state: { [key: string]: boolean }, action: { type: string; machineId: string }) => {
    switch (action.type) {
        case 'TOGGLE':
            return { ...state, [action.machineId]: !state[action.machineId] };
        default:
            return state;
    }
};

export default App;