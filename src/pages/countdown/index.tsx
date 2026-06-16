import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import CountdownCard from '@/components/CountdownCard';
import AchievementBadge from '@/components/AchievementBadge';
import { achievements } from '@/data/achievements';
import { useAppStore } from '@/store/useAppStore';
import type { CountdownItem, NightShiftStage } from '@/types';

const encouragements = [
  { emoji: '💪', text: '坚持住！天快亮了，你是最棒的夜班战士！' },
  { emoji: '🌙', text: '深夜的坚守，是为了更好的明天。加油！' },
  { emoji: '⭐', text: '每一个奋斗的夜晚，都在点亮你的未来。' },
  { emoji: '☕', text: '困了就歇会儿，喝口水，你已经很努力了。' },
  { emoji: '🏠', text: '家人在等你平安回家，注意安全！' },
  { emoji: '🌟', text: '你不是一个人在战斗，万千工友与你同在！' },
  { emoji: '💯', text: '再坚持一会儿，胜利就在前方！' },
  { emoji: '🌅', text: '熬过这个夜晚，就能看到最美的日出。' },
];

const CountdownPage: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(dayjs().format('YYYY-MM-DD HH:mm:ss'));
  const [currentStage, setCurrentStage] = useState<NightShiftStage>('mid');
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkinStreak, setCheckinStreak] = useState(7);
  const [encouragement, setEncouragement] = useState(encouragements[0]);
  const { stageLabels } = useAppStore();

  const countdownItems: CountdownItem[] = [
    {
      id: '1',
      type: 'off_work',
      label: '距离下班',
      targetTime: dayjs().format('YYYY-MM-DD') + ' 08:00:00',
      icon: '🏠',
      color: '#F59E0B',
    },
    {
      id: '2',
      type: 'sunrise',
      label: '距离日出',
      targetTime: dayjs().format('YYYY-MM-DD') + ' 05:30:00',
      icon: '🌅',
      color: '#FB923C',
    },
    {
      id: '3',
      type: 'family_wake',
      label: '家人醒来还有',
      targetTime: dayjs().format('YYYY-MM-DD') + ' 07:00:00',
      icon: '👨‍👩‍👧',
      color: '#10B981',
    },
  ];

  const determineStage = useCallback(() => {
    const hour = dayjs().hour();
    let stage: NightShiftStage;
    if (hour >= 22 || hour < 1) {
      stage = 'early';
    } else if (hour >= 1 && hour < 4) {
      stage = 'mid';
    } else if (hour >= 4 && hour < 6) {
      stage = 'late';
    } else {
      stage = 'pre_sleep';
    }
    console.log('[CountdownPage] 当前夜班阶段:', stageLabels[stage]);
    setCurrentStage(stage);
  }, [stageLabels]);

  useEffect(() => {
    determineStage();
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('YYYY-MM-DD HH:mm:ss'));
      determineStage();
    }, 1000);

    const randomIndex = Math.floor(Math.random() * encouragements.length);
    setEncouragement(encouragements[randomIndex]);

    return () => clearInterval(timer);
  }, [determineStage]);

  useDidShow(() => {
    console.log('[CountdownPage] 页面显示');
    const randomIndex = Math.floor(Math.random() * encouragements.length);
    setEncouragement(encouragements[randomIndex]);
  });

  const handleCheckin = () => {
    console.log('[CountdownPage] 点击打卡按钮');
    if (isCheckedIn) {
      Taro.showToast({
        title: '今天已打卡',
        icon: 'success',
      });
      return;
    }

    Taro.showLoading({ title: '打卡中...' });
    setTimeout(() => {
      setIsCheckedIn(true);
      setCheckinStreak((prev) => prev + 1);
      Taro.hideLoading();
      Taro.showToast({
        title: '打卡成功！',
        icon: 'success',
      });
      console.log('[CountdownPage] 打卡成功，连续打卡天数:', checkinStreak + 1);
    }, 800);
  };

  const handleViewAllAchievements = () => {
    console.log('[CountdownPage] 查看全部成就');
    Taro.navigateTo({
      url: '/pages/achievement/index',
    });
  };

  const handlePullDownRefresh = () => {
    console.log('[CountdownPage] 下拉刷新');
    const randomIndex = Math.floor(Math.random() * encouragements.length);
    setEncouragement(encouragements[randomIndex]);
    setTimeout(() => {
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

  const unlockedAchievements = achievements.filter((a) => a.isUnlocked).slice(0, 5);
  const lockedAchievements = achievements.filter((a) => !a.isUnlocked).slice(0, 2);
  const displayAchievements = [...unlockedAchievements, ...lockedAchievements];

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>🌙 天亮倒计时</Text>
        <Text className={styles.currentTime}>{currentTime}</Text>
        <View className={styles.stageTag}>
          <Text>📍 当前阶段：{stageLabels[currentStage]}</Text>
        </View>
      </View>

      <View className={styles.countdownSection}>
        {countdownItems.map((item) => (
          <CountdownCard key={item.id} item={item} totalDuration={36000} />
        ))}
      </View>

      <View className={styles.checkinSection}>
        <Button
          className={classnames(styles.checkinBtn, isCheckedIn && styles.checked)}
          onClick={handleCheckin}
        >
          <Text>{isCheckedIn ? '✓ 今日已打卡' : '✓ 夜班打卡'}</Text>
        </Button>
        <View className={styles.checkinStreak}>
          <Text>连续打卡 </Text>
          <Text className={styles.highlight}>{checkinStreak}</Text>
          <Text> 天</Text>
        </View>
      </View>

      <View className={styles.achievementSection}>
        <View className={styles.sectionTitle}>
          <Text>🏆 我的成就</Text>
          <Text className={styles.viewAll} onClick={handleViewAllAchievements}>
            查看全部 →
          </Text>
        </View>
        <ScrollView className={styles.achievementScroll} scrollX>
          {displayAchievements.map((achievement) => (
            <View key={achievement.id} className={styles.achievementItem}>
              <View
                className={classnames(
                  styles.icon,
                  !achievement.isUnlocked && styles.locked
                )}
              >
                <Text>{achievement.isUnlocked ? achievement.icon : '🔒'}</Text>
              </View>
              <Text className={styles.name}>{achievement.name}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View className={styles.encouragement}>
        <Text className={styles.encouragementText}>
          <Text className={styles.emoji}>{encouragement.emoji}</Text>
          {encouragement.text}
        </Text>
      </View>
    </ScrollView>
  );
};

export default CountdownPage;
