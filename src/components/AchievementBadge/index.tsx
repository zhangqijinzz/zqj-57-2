import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { Achievement } from '@/types';

interface AchievementBadgeProps {
  achievement: Achievement;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({ achievement }) => {
  const progressPercent = Math.min(100, (achievement.progress / achievement.target) * 100);

  return (
    <View
      className={classnames(
        styles.badge,
        achievement.isUnlocked ? styles.unlocked : styles.locked
      )}
    >
      <View
        className={classnames(
          styles.icon,
          achievement.isUnlocked ? styles.unlocked : styles.locked
        )}
      >
        <Text>{achievement.isUnlocked ? achievement.icon : '🔒'}</Text>
      </View>
      <View className={styles.info}>
        <View className={styles.name}>
          <Text>{achievement.name}</Text>
          {achievement.isUnlocked && <Text className={styles.unlockedTag}>已解锁</Text>}
        </View>
        <Text className={styles.description}>{achievement.description}</Text>
        {!achievement.isUnlocked && (
          <>
            <View className={styles.progressBar}>
              <View
                className={styles.progressFill}
                style={{ width: `${progressPercent}%` }}
              />
            </View>
            <Text className={styles.progressText}>
              {achievement.progress} / {achievement.target}
            </Text>
          </>
        )}
        {achievement.isUnlocked && achievement.unlockedDate && (
          <Text className={styles.unlockedDate}>🎉 解锁于 {achievement.unlockedDate}</Text>
        )}
      </View>
    </View>
  );
};

export default AchievementBadge;
