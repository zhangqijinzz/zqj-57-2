import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import GameCard from '@/components/GameCard';
import { games } from '@/data/games';
import type { Game } from '@/types';

const categories = [
  { id: 'all', label: '全部' },
  { id: '节奏', label: '节奏' },
  { id: '消除', label: '消除' },
  { id: '益智', label: '益智' },
  { id: '动作', label: '动作' },
  { id: '休闲', label: '休闲' },
];

const GamesPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [filteredGames, setFilteredGames] = useState<Game[]>(games);
  const [localGames, setLocalGames] = useState<Game[]>(games);

  useEffect(() => {
    filterGames();
  }, [activeCategory]);

  useDidShow(() => {
    console.log('[GamesPage] 页面显示');
  });

  const filterGames = () => {
    let filtered = localGames;
    if (activeCategory !== 'all') {
      filtered = localGames.filter((g) => g.category === activeCategory);
    }
    console.log('[GamesPage] 筛选游戏，分类:', activeCategory, '数量:', filtered.length);
    setFilteredGames(filtered);
  };

  const handleCategoryClick = (categoryId: string) => {
    console.log('[GamesPage] 点击分类:', categoryId);
    setActiveCategory(categoryId);
  };

  const handleGameClick = (game: Game) => {
    console.log('[GamesPage] 点击游戏:', game.id, game.name);

    setLocalGames((prev) =>
      prev.map((g) =>
        g.id === game.id ? { ...g, playCount: g.playCount + 1 } : g
      )
    );

    Taro.navigateTo({
      url: `/pages/game-detail/index?id=${game.id}`,
    });
  };

  const handlePullDownRefresh = () => {
    console.log('[GamesPage] 下拉刷新');
    setTimeout(() => {
      filterGames();
      Taro.stopPullDownRefresh();
    }, 1000);
  };

  useEffect(() => {
    if (typeof Taro.onPullDownRefresh === 'function') {
      Taro.onPullDownRefresh(handlePullDownRefresh);
      return () => {
        if (typeof Taro.offPullDownRefresh === 'function') {
          Taro.offPullDownRefresh(handlePullDownRefresh);
        }
      };
    }
  }, []);

  const totalPlayCount = localGames.reduce((sum, g) => sum + g.playCount, 0);
  const highScore = Math.max(...localGames.map((g) => g.highScore));
  const featuredGame = localGames[0];

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>🎮 车间小游戏</Text>
        <Text className={styles.subtitle}>
          单手操作，碎片化时间轻松解压
        </Text>
      </View>

      <ScrollView className={styles.tabs} scrollX>
        {categories.map((category) => (
          <View
            key={category.id}
            className={classnames(styles.tabItem, activeCategory === category.id && styles.active)}
            onClick={() => handleCategoryClick(category.id)}
          >
            <Text className={styles.tabLabel}>{category.label}</Text>
          </View>
        ))}
      </ScrollView>

      <View className={styles.statsBar}>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{localGames.length}</Text>
          <Text className={styles.statLabel}>游戏总数</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>
            {totalPlayCount >= 10000
              ? `${(totalPlayCount / 10000).toFixed(1)}万`
              : totalPlayCount}
          </Text>
          <Text className={styles.statLabel}>总游玩次数</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{highScore}</Text>
          <Text className={styles.statLabel}>最高分</Text>
        </View>
      </View>

      {activeCategory === 'all' && featuredGame && (
        <View className={styles.featuredGame}>
          <Text className={styles.featuredLabel}>
            <Text className={styles.emoji}>🔥</Text>
            热门推荐
          </Text>
          <GameCard game={featuredGame} onClick={handleGameClick} />
        </View>
      )}

      <View className={styles.gameGrid}>
        {filteredGames.length > 0 ? (
          filteredGames
            .filter((g) => activeCategory !== 'all' || g.id !== featuredGame?.id)
            .map((game) => (
              <View key={game.id} className={styles.gameCardWrapper}>
                <GameCard game={game} onClick={handleGameClick} />
              </View>
            ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emoji}>🎮</Text>
            <Text className={styles.title}>暂无游戏</Text>
            <Text className={styles.desc}>该分类下暂时没有小游戏</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default GamesPage;
