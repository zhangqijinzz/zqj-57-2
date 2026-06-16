import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import AchievementBadge from '@/components/AchievementBadge';
import { achievements } from '@/data/achievements';
import type { Achievement } from '@/types';

const categoryOptions = [
  { id: 'all', label: '全部' },
  { id: 'checkin', label: '打卡' },
  { id: 'social', label: '社交' },
  { id: 'game', label: '游戏' },
  { id: 'health', label: '健康' },
];

const AchievementPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [filteredAchievements, setFilteredAchievements] = useState<Achievement[]>(achievements);

  useEffect(() => {
    filterAchievements();
  }, [activeCategory]);

  useDidShow(() => {
    console.log('[AchievementPage] 页面显示');
  });

  const filterAchievements = () => {
    let filtered = achievements;
    if (activeCategory !== 'all') {
      filtered = achievements.filter((a) => a.category === activeCategory);
    }
    console.log(
      '[AchievementPage] 筛选成就，分类:',
      activeCategory,
      '数量:',
      filtered.length
    );
    setFilteredAchievements(filtered);
  };

  const handleCategoryClick = (categoryId: string) => {
    console.log('[AchievementPage] 点击分类:', categoryId);
    setActiveCategory(categoryId);
  };

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const totalCount = achievements.length;

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>🏆 成就中心</Text>
        <View className={styles.stats}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{unlockedCount}</Text>
            <Text className={styles.statLabel}>已解锁</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{totalCount}</Text>
            <Text className={styles.statLabel}>全部成就</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>
              {Math.round((unlockedCount / totalCount) * 100)}%
            </Text>
            <Text className={styles.statLabel}>完成度</Text>
          </View>
        </View>
      </View>

      <ScrollView className={styles.tabs} scrollX>
        {categoryOptions.map((category) => (
          <View
            key={category.id}
            className={classnames(styles.tabItem, activeCategory === category.id && styles.active)}
            onClick={() => handleCategoryClick(category.id)}
          >
            <Text className={styles.tabLabel}>{category.label}</Text>
          </View>
        ))}
      </ScrollView>

      <View className={styles.achievementList}>
        {filteredAchievements.map((achievement) => (
          <AchievementBadge key={achievement.id} achievement={achievement} />
        ))}
      </View>
    </ScrollView>
  );
};

export default AchievementPage;
