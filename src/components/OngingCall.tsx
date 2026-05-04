import React from 'react';
import { Phone, Clock, User, List, Globe } from 'lucide-react';

// Icon wrappers to match expected props
const PhoneIcon = ({ size, className }: { size?: number; className?: string }) => <Phone size={size} className={className} />;
const ClockIcon = ({ size, className }: { size?: number; className?: string }) => <Clock size={size} className={className} />;
const UserIcon = ({ size, className }: { size?: number; className?: string }) => <User size={size} className={className} />;
const ListIcon = ({ size, className }: { size?: number; className?: string }) => <List size={size} className={className} />;
const GlobeIcon = ({ size, className }: { size?: number; className?: string }) => <Globe size={size} className={className} />;

const dotClass: Record<string, string> = {
  purple: 'bg-purple-400',
  yellow: 'bg-yellow-400',
  gray: 'bg-gray-300',
  outline: 'bg-transparent border border-gray-300',
};

interface CallData {
  avatarColor: string;
  agentInitials: string;
  agentName: string;
  callTime: string;
  callType: 'inbound' | 'outbound';
  callCount: number;
  duration: string;
  assignee: string;
  assigneeCount: number;
  dots: string[];
  callId: string;
}

const CallCard: React.FC<{ call: CallData }> = ({ call }) => (
  <div className="bg-gray-50 border border-gray-200 p-3">
    {/* Header */}
    <div className="flex items-center gap-2 mb-2.5">
      <div className={`w-9 h-9 bg-gradient-to-br ${call.avatarColor} flex items-center justify-center text-[12px] font-semibold text-white flex-shrink-0`}>
        {call.agentInitials}
      </div>
      <div>
        <div className="text-xs font-semibold text-gray-900">{call.agentName}</div>
        <div className="flex items-center gap-1 text-gray-500 text-[10px] mt-0.5">
          <PhoneIcon size={10} className="text-[#aaa]" />
          {call.callTime}
        </div>
      </div>
    </div>

    {/* Stats */}
    <div className="flex gap-3 py-1.5 border-t border-b border-gray-100 mb-2">
      <div className={`flex items-center gap-1 text-[11px] ${call.callType === 'inbound' ? 'text-green-500' : 'text-red-500'}`}>
        <PhoneIcon size={11} />
        {call.callCount}
      </div>
      <div className="flex items-center gap-1 text-[11px] text-gray-500">
        <ClockIcon size={11} />
        {call.duration}
      </div>
    </div>

    {/* Assignee */}
    <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-1.5">
      <UserIcon size={10} />
      {call.assignee}
      <div className="w-4 h-4 bg-gray-100 flex items-center justify-center text-[9px] text-gray-500 ml-0.5">
        {call.assigneeCount}
      </div>
    </div>

    {/* Dots */}
    <div className="flex flex-wrap gap-[3px] my-1.5">
      {call.dots.map((d, i) => (
        <div key={i} className={`w-[9px] h-[9px] ${dotClass[d]}`} />
      ))}
    </div>

    {/* Footer */}
    <div className="flex items-center justify-between mt-1">
      <span className="text-[10px] text-gray-400">ID {call.callId}</span>
      <div className="flex gap-1.5 text-gray-400">
        <ListIcon size={12} />
        <GlobeIcon size={12} />
      </div>
    </div>
  </div>
);

// Sample calls data
const sampleCalls: CallData[] = [
  {
    avatarColor: 'from-purple-500 to-pink-500',
    agentInitials: 'JD',
    agentName: 'John Doe',
    callTime: '2:30 PM',
    callType: 'inbound',
    callCount: 3,
    duration: '15:42',
    assignee: 'Coach',
    assigneeCount: 1,
    dots: ['purple', 'yellow', 'gray'],
    callId: '001',
  },
];

const OngoingCalls: React.FC = () => (
  <div>
    <h2 className="text-base font-semibold text-gray-900 mb-3">Ongoing Calls</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
      {sampleCalls.length > 0 ? (
        sampleCalls.map((call, index) => <CallCard key={index} call={call} />)
      ) : (
        <p className="text-sm text-gray-400 col-span-full text-center py-4">No ongoing calls</p>
      )}
    </div>
  </div>
);

export default OngoingCalls;
