import React, { useState } from 'react';
import TrendModal from './TrendModal';
import KeyValue from './KeyValue';
import { typeExtendedReport, typeTitles } from '../types/types';
import { TITLES } from '../utils/constants';

interface ServerProps {
  server: typeExtendedReport;
  isExpanded: boolean;
  onToggleExpand: () => void;
  selectedFields: (keyof typeExtendedReport)[];
}

const Server: React.FC<ServerProps> = ({ server, isExpanded, onToggleExpand, selectedFields }) => {
  const [showTrendModal, setShowTrendModal] = useState(false);

  return (
    <div className={`bg-white rounded-lg shadow-sm ${server.is_offline ? 'offline' : 'online'}`}>
      <div
        className="p-2 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
        onClick={onToggleExpand}
      >
        <div className="grid-container text-sm">
          {selectedFields.map((key) => (
            <KeyValue key={key} titles={TITLES} k={key} v={server[key]} />
          ))}
        </div>
      </div>
      {isExpanded && (
        <div className="p-2 border-t border-gray-200">
          <div className="grid-container text-sm">
            {Object.keys(TITLES)
              .filter((key) => TITLES.hasOwnProperty(key) && !selectedFields.includes(key as keyof typeTitles))
              .map((key) => (
                <KeyValue key={key} titles={TITLES} k={key as keyof typeTitles} v={server[key as keyof typeTitles]} />
              ))}
            <div>
              <span className="kv-k text-gray-400 text-xs">操作</span>
              <div
                className="operate-button"
                onClick={() => setShowTrendModal(true)}
              >
                统计
              </div>
            </div>
          </div>
        </div>
      )}
      {showTrendModal && (
        <TrendModal
          clientId={server.client_id}
          onClose={(event: React.MouseEvent) => {
            event.stopPropagation();
            setShowTrendModal(false)
          }}
        />
      )}
    </div>
  );
};

export default Server;