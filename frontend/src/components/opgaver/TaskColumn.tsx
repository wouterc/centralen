import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Opgave, User } from '../../types';
import TaskCard from './TaskCard';

interface TaskColumnProps {
    id: string;
    title: React.ReactNode;
    tasks: Opgave[];
    onTaskClick: (opgave: Opgave) => void;
    users?: User[];
    onAssigneeChange?: (opgaveId: number, userIds: number[]) => void;
    headerAction?: React.ReactNode;
}

const TaskColumn: React.FC<TaskColumnProps> = ({ id, title, tasks, onTaskClick, users, onAssigneeChange, headerAction }) => {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div
            className={`
                flex flex-col h-full w-72 rounded-xl border transition-all flex-shrink-0
                ${isOver
                    ? 'bg-gray-400/40 border-blue-400 shadow-lg scale-[1.01] z-20'
                    : 'bg-gray-300 border-gray-400/20'
                }
            `}
        >
            {/* Header */}
            <div className="px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-gray-800 text-sm uppercase tracking-tight">{title}</h3>
                    <span className="bg-gray-400/20 px-2 py-0.5 rounded-md text-[10px] font-black text-gray-600 shadow-sm border border-gray-400/10">
                        {tasks.length}
                    </span>
                </div>
                {headerAction && <div>{headerAction}</div>}
            </div>

            {/* Droppable Area */}
            <div ref={setNodeRef} className="flex-1 px-2 pb-2 overflow-y-auto custom-scrollbar">
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            opgave={task}
                            onClick={onTaskClick}
                            users={users}
                            onAssigneeChange={onAssigneeChange}
                        />
                    ))}
                </SortableContext>

                {tasks.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-xs italic">
                        Slip opgave her
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskColumn;
