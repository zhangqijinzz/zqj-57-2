import React, { useState } from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { Worker } from '@/types';

interface WorkerCardProps {
  worker: Worker;
  onVoicePlay?: (workerId: string) => void;
  onClick?: (worker: Worker) => void;
}

const WorkerCard: React.FC<WorkerCardProps> = ({ worker, onVoicePlay, onClick }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleCardClick = () => {
    console.log('[WorkerCard] 点击工友卡片:', worker.id, worker.name);
    onClick?.(worker);
  };

  const handleVoiceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('[WorkerCard] 点击语音播放:', worker.id, worker.voiceMessage);
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      Taro.showToast({
        title: '播放语音',
        icon: 'none',
        duration: 1000,
      });
      setTimeout(() => {
        setIsPlaying(false);
        onVoicePlay?.(worker.id);
      }, (worker.voiceDuration || 5) * 1000);
    }
  };

  const getStatusClass = () => {
    switch (worker.status) {
      case 'on_shift':
        return styles.onShift;
      case 'rest':
        return styles.rest;
      default:
        return styles.offline;
    }
  };

  return (
    <View className={styles.card} onClick={handleCardClick}>
      <View className={styles.header}>
        <View className={styles.avatar}>
          <Image
            src={worker.avatar}
            mode="aspectFill"
            onError={(e) => console.error('[WorkerCard] 头像加载失败:', e.detail)}
          />
          <View className={classnames(styles.statusDot, getStatusClass())} />
        </View>
        <View className={styles.info}>
          <View className={styles.nameRow}>
            <Text className={styles.name}>{worker.name}</Text>
            <Text className={styles.industryTag}>{worker.industryLabel}</Text>
          </View>
          <Text className={styles.shiftTime}>⏰ {worker.shiftTime}</Text>
          <Text className={styles.workplace}>📍 {worker.workplace}</Text>
        </View>
      </View>

      <View className={styles.tags}>
        {worker.tags.map((tag, index) => (
          <Text key={index} className={styles.tag}>
            #{tag}
          </Text>
        ))}
      </View>

      {worker.voiceMessage && (
        <View className={styles.voiceBox} onClick={handleVoiceClick}>
          <Button
            className={classnames(styles.voiceBtn, isPlaying && styles.playing)}
            onClick={handleVoiceClick}
          >
            <Text className={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
          </Button>
          <View className={styles.voiceContent}>
            <Text className={styles.voiceText}>{worker.voiceMessage}</Text>
            <View className={styles.voiceMeta}>
              <Text className={styles.duration}>🎙️ {worker.voiceDuration}s</Text>
              <Text className={styles.lastActive}>{worker.lastActive}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default WorkerCard;
