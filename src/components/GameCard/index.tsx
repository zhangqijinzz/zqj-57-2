import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import styles from './index.module.scss';
import type { Game } from '@/types';

interface GameCardProps {
  game: Game;
  onClick?: (game: Game) => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, onClick }) => {
  const handleClick = () => {
    console.log('[GameCard] 点击游戏:', game.id, game.name);
    onClick?.(game);
  };

  const getDifficultyStars = () => {
    const count = game.difficulty === 'easy' ? 1 : game.difficulty === 'medium' ? 2 : 3;
    return [1, 2, 3].map((i) => (
      <Text
        key={i}
        className={`${styles.star} ${i <= count ? styles.filled : styles.empty}`}
      >
        ★
      </Text>
    ));
  };

  const formatPlayCount = (count: number) => {
    if (count >= 10000) {
      return `${(count / 10000).toFixed(1)}万`;
    }
    return count.toString();
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.cover}>
        <Image
          src={game.coverImage}
          mode="aspectFill"
          onError={(e) => console.error('[GameCard] 封面加载失败:', e.detail)}
        />
        <Text className={styles.categoryTag}>{game.category}</Text>
        <Text className={styles.playCount}>▶ {formatPlayCount(game.playCount)}</Text>
      </View>
      <View className={styles.content}>
        <Text className={styles.name}>{game.name}</Text>
        <Text className={styles.description}>{game.description}</Text>
        <View className={styles.meta}>
          <View className={styles.difficulty}>
            <Text className={styles.label}>难度:</Text>
            <View className={styles.stars}>{getDifficultyStars()}</View>
          </View>
          <Text className={styles.time}>
            约 <Text className={styles.highlight}>{game.estimatedTime}</Text> 分钟
          </Text>
          <Text className={styles.highScore}>🏆 {game.highScore}</Text>
        </View>
      </View>
    </View>
  );
};

export default GameCard;
