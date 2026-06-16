import React, { useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import dayjs from 'dayjs';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { CountdownItem } from '@/types';

interface CountdownCardProps {
  item: CountdownItem;
  totalDuration?: number;
}

const CountdownCard: React.FC<CountdownCardProps> = ({ item, totalDuration = 36000 }) => {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const calculateRemaining = () => {
      const now = dayjs();
      let target = dayjs(item.targetTime);

      if (target.isBefore(now)) {
        target = target.add(1, 'day');
      }

      const diff = target.diff(now, 'second');
      setRemaining(diff);
    };

    calculateRemaining();
    const timer = setInterval(calculateRemaining, 1000);

    return () => clearInterval(timer);
  }, [item.targetTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: secs.toString().padStart(2, '0'),
    };
  };

  const time = formatTime(Math.max(0, remaining));
  const progress = Math.min(100, ((totalDuration - remaining) / totalDuration) * 100);

  return (
    <View className={classnames(styles.card)} style={{ color: item.color }}>
      <View className={styles.header}>
        <View className={styles.icon} style={{ backgroundColor: `${item.color}20` }}>
          <Text>{item.icon}</Text>
        </View>
        <View className={styles.info}>
          <Text className={styles.label}>{item.label}</Text>
          <Text className={styles.targetTime}>目标时间: {item.targetTime}</Text>
        </View>
      </View>

      <View className={styles.countdown}>
        <View className={styles.timeBlock}>
          <Text className={styles.timeValue} style={{ color: item.color }}>
            {time.hours}
          </Text>
          <Text className={styles.timeLabel}>小时</Text>
        </View>
        <Text className={styles.separator}>:</Text>
        <View className={styles.timeBlock}>
          <Text className={styles.timeValue} style={{ color: item.color }}>
            {time.minutes}
          </Text>
          <Text className={styles.timeLabel}>分钟</Text>
        </View>
        <Text className={styles.separator}>:</Text>
        <View className={styles.timeBlock}>
          <Text className={styles.timeValue} style={{ color: item.color }}>
            {time.seconds}
          </Text>
          <Text className={styles.timeLabel}>秒</Text>
        </View>
      </View>

      <View className={styles.progressBar}>
        <View
          className={styles.progressFill}
          style={{ width: `${progress}%`, backgroundColor: item.color, color: item.color }}
        />
      </View>
    </View>
  );
};

export default CountdownCard;
