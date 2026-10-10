import React from 'react';
import { EMOJI_LIST, type EmojiReaction } from '../../types';
import './Reactions.css';

interface ReactionsProps {
  reacciones: Record<EmojiReaction, number>;
  onReaccionar: (emoji: EmojiReaction) => void;
}

export const Reactions: React.FC<ReactionsProps> = ({ reacciones, onReaccionar }) => {
  return (
    <div className="reactions-bar">
      {EMOJI_LIST.map((emoji) => {
        const count = reacciones[emoji] || 0;
        return (
          <button
            key={emoji}
            type="button"
            className={`reaction-btn ${count > 0 ? 'has-votes' : ''}`}
            onClick={() => onReaccionar(emoji)}
            title={`Reaccionar con ${emoji}`}
          >
            <span className="reaction-emoji">{emoji}</span>
            <span className="reaction-count">{count}</span>
          </button>
        );
      })}
    </div>
  );
};
