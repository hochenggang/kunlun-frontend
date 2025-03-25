import React from 'react';
import type { typeTitles } from '../types/types';

interface KeyValueProps<T extends object> {
    titles: Partial<T>;
    k: keyof T;
    v: number | string | React.ReactNode;
}

const KeyValue: React.FC<KeyValueProps<typeTitles>> = ({ titles, k, v }) => {
    // 输入说明列表和键值对，渲染键值对及其说明
    return (
        <div>
            <span
                className="kv-k text-gray-400 text-xs"
                title={titles[k]?.[2]}
            >
                {titles[k]?.[0]}
            </span>
            <div className="kv-v text-gray-700">
                {v} {titles[k]?.[1]}
            </div>
        </div>
    );
};

export default KeyValue;