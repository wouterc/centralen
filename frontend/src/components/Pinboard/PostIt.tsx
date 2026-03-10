import React from 'react';
import type { PinboardPost } from '../../types';
import { ThumbsUp, HelpCircle, CheckCircle, User, Users } from 'lucide-react';

interface PostItProps {
    post: PinboardPost;
    onClick?: (post: PinboardPost) => void;
    scale?: number;
}

const PostIt: React.FC<PostItProps> = ({ post, onClick, scale = 1 }) => {
    // Random decoration logic based on post ID (consistent per post)
    const decoration = React.useMemo(() => {
        const id = post.id || 0;
        const types = ['PIN', 'TAPE'];
        const pinColors = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#6366f1'];

        return {
            type: types[id % 2],
            rotation: (id * 1337 % 20 - 10), // Random rotation -10 to 10
            color: pinColors[id % pinColors.length],
            offsetX: (id * 777 % 40 - 20), // -20 to 20px
        };
    }, [post.id]);

    // Random rotation and translation for that "messy" look
    const [style] = React.useState(() => ({
        rotation: (Math.random() * 8 - 4).toFixed(2),
    }));

    const [isHovered, setIsHovered] = React.useState(false);

    const isUnread = post.requires_evaluation;

    // Scale logic: If we are very small, we go "mini"
    const isMini = scale < 0.85 && !isHovered;

    // Base colors
    const bgColor = isUnread ? 'bg-red-100' : 'bg-yellow-50';
    const borderColor = isUnread ? 'border-red-300' : 'border-yellow-200';
    const shadowColor = isUnread ? 'shadow-red-200' : 'shadow-yellow-100';

    return (
        <div
            onClick={() => onClick?.(post)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`
                relative cursor-pointer
                ${isMini ? 'w-48 p-4 pt-10' : 'w-72 p-6 pt-12'} 
                ${bgColor} border ${borderColor} 
                shadow-lg ${shadowColor}
                transition-all duration-300 ease-out
                flex flex-col gap-2 group
                ${isHovered ? 'z-50! scale-105 rotate-0 translate-x-0 translate-y-0 shadow-2xl!' : ''}
            `}
            style={{
                transform: isHovered
                    ? 'scale(1.1) rotate(0deg)'
                    : `rotate(${style.rotation}deg) scale(${scale})`,
                fontFamily: '"Outfit", sans-serif',
                minHeight: isMini ? '120px' : '200px',
                transformOrigin: 'center center',
            }}
        >
            {/* Decoration: Pin or Tape */}
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none transition-all duration-300"
                style={{
                    transform: `translateX(calc(-50% + ${decoration.offsetX}px)) rotate(${decoration.rotation}deg)`,
                    marginTop: decoration.type === 'TAPE' ? '0px' : '10px'
                }}
            >
                {decoration.type === 'PIN' ? (
                    <div className="relative">
                        {/* Shadow of pin */}
                        <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-black/20 blur-[1px]" />
                        {/* Pin Head */}
                        <div
                            className="w-4 h-4 rounded-full shadow-inner border border-black/10"
                            style={{ backgroundColor: decoration.color }}
                        />
                        {/* Pin Point Shade */}
                        <div className="w-0.5 h-3 bg-gray-400 mx-auto -mt-0.5 shadow-sm" />
                    </div>
                ) : (
                    <div
                        className="w-16 h-8 bg-white/30 backdrop-blur-[1px] border border-white/20 shadow-sm"
                        style={{ transform: `rotate(${decoration.rotation * 0.5}deg) translateY(-10px)` }}
                    />
                )}
            </div>

            {/* Red "Unread" strip */}
            {isUnread && (
                <div className={`absolute top-0 left-0 w-full bg-red-500 rounded-t-sm transition-all ${isMini ? 'h-1.5' : 'h-3'}`} />
            )}

            <div className="flex-1 overflow-hidden">
                <h3 className={`font-black text-gray-800 leading-tight transition-all ${isMini ? 'text-sm mb-1 line-clamp-2' : 'text-xl mb-3'}`}>
                    {post.titel}
                </h3>

                {(!isMini || isHovered) && (
                    <p className={`text-gray-700 whitespace-pre-wrap italic transition-all ${isMini ? 'text-xs line-clamp-2' : 'text-sm'}`}>
                        {post.teaser_text}
                    </p>
                )}
            </div>

            {/* Summary Stats - Only if not mini */}
            {(!isMini || isHovered) && post.evaluation_summary && (
                <div className="mt-1 text-[8px] font-bold text-gray-500/80 italic flex flex-wrap gap-x-2">
                    {post.evaluation_summary.GOD_IDE > 0 && <span>{post.evaluation_summary.GOD_IDE} synes det er en god idé</span>}
                    {post.evaluation_summary.PENDING > 0 && <span className="text-blue-500/60">{post.evaluation_summary.PENDING} mangler at vurdere</span>}
                </div>
            )}

            {/* Bottom Metadata & Status */}
            {(!isMini || isHovered) && (
                <div className="mt-auto pt-3 border-t border-black/5 flex justify-between items-end animate-in fade-in duration-500">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-wider">
                            <User size={10} />
                            <span className="truncate max-w-[80px]">{post.oprettet_af_details?.username}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-wider">
                            <Users size={10} />
                            <span className="truncate max-w-[80px]">{post.team_details?.navn}</span>
                        </div>
                    </div>

                    {/* Specific User Evaluation Result */}
                    {post.user_evaluation && (
                        <div className={`
                            flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shadow-sm transition-all
                            ${post.user_evaluation === 'GOD_IDE' ? 'bg-green-50 border-green-200 text-green-700' :
                                post.user_evaluation === 'INGEN_MENING' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                    'bg-gray-50 border-gray-200 text-gray-700'}
                        `}>
                            {post.user_evaluation === 'GOD_IDE' && <ThumbsUp size={10} />}
                            {post.user_evaluation === 'INGEN_MENING' && <HelpCircle size={10} />}
                            {post.user_evaluation === 'LÆST' && <CheckCircle size={10} />}
                            <span className="text-[9px] font-black uppercase">
                                {post.user_evaluation === 'GOD_IDE' ? 'GOD IDÉ' :
                                    post.user_evaluation === 'INGEN_MENING' ? 'VED IKKE' : 'LÆST'}
                            </span>
                        </div>
                    )}

                    {isUnread && isHovered && (
                        <div className="text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 animate-pulse shadow-sm">
                            VURDÉR NU
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PostIt;
