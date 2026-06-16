import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import WorkerCard from '@/components/WorkerCard';
import { workers, industryTags } from '@/data/workers';
import type { Worker, IndustryType } from '@/types';

const CirclePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<IndustryType | 'all'>('all');
  const [filteredWorkers, setFilteredWorkers] = useState(workers);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [localWorkers, setLocalWorkers] = useState(workers);

  useEffect(() => {
    filterWorkers();
  }, [activeTab]);

  useDidShow(() => {
    console.log('[CirclePage] 页面显示');
  });

  const filterWorkers = () => {
    let filtered = localWorkers;
    if (activeTab !== 'all') {
      filtered = localWorkers.filter((w) => w.industry === activeTab);
    }
    console.log('[CirclePage] 筛选工友，行业:', activeTab, '数量:', filtered.length);
    setFilteredWorkers(filtered);
  };

  const handleTabClick = (tab: IndustryType | 'all') => {
    console.log('[CirclePage] 点击行业标签:', tab);
    setActiveTab(tab);
  };

  const handleWorkerClick = (worker: Worker) => {
    console.log('[CirclePage] 点击工友:', worker.id, worker.name);
    Taro.navigateTo({
      url: `/pages/worker-detail/index?id=${worker.id}`,
    });
  };

  const handleVoicePlay = (workerId: string) => {
    console.log('[CirclePage] 播放语音，工友ID:', workerId);
  };

  const handleFabClick = () => {
    console.log('[CirclePage] 点击发布语音按钮');
    setShowRecordModal(true);
    setIsRecording(true);
    setRecordingTime(0);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 60) {
            handleSend();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const handleCancel = () => {
    console.log('[CirclePage] 取消录音');
    setIsRecording(false);
    setShowRecordModal(false);
    setRecordingTime(0);
  };

  const handleSend = () => {
    console.log('[CirclePage] 发送语音，时长:', recordingTime, '秒');
    setIsRecording(false);
    setShowRecordModal(false);

    const newMessage: Worker = {
      ...localWorkers[0],
      id: Date.now().toString(),
      voiceMessage: '这是我刚刚发布的语音留言，大家好！',
      voiceDuration: recordingTime,
      lastActive: '刚刚',
    };

    setLocalWorkers([newMessage, ...localWorkers]);
    Taro.showToast({
      title: '语音发布成功！',
      icon: 'success',
    });

    setRecordingTime(0);
  };

  const handlePullDownRefresh = () => {
    console.log('[CirclePage] 下拉刷新');
    setTimeout(() => {
      filterWorkers();
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const onlineCount = localWorkers.filter((w) => w.status === 'on_shift').length;
  const voiceCount = localWorkers.filter((w) => w.voiceMessage).length;

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>👥 异步工友圈</Text>
        <Text className={styles.subtitle}>
          按行业匹配，语音留言异步交流，不打扰工作
        </Text>
      </View>

      <ScrollView className={styles.tabs} scrollX>
        <View
          className={classnames(styles.tabItem, activeTab === 'all' && styles.active)}
          onClick={() => handleTabClick('all')}
        >
          <Text className={styles.tabLabel}>全部</Text>
          <Text className={styles.tabCount}>{localWorkers.length}</Text>
        </View>
        {industryTags.map((tag) => (
          <View
            key={tag.type}
            className={classnames(styles.tabItem, activeTab === tag.type && styles.active)}
            onClick={() => handleTabClick(tag.type)}
          >
            <Text className={styles.tabLabel}>{tag.label}</Text>
            <Text className={styles.tabCount}>{tag.count}</Text>
          </View>
        ))}
      </ScrollView>

      <View className={styles.statsBar}>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{onlineCount}</Text>
          <Text className={styles.statLabel}>上班中</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{voiceCount}</Text>
          <Text className={styles.statLabel}>语音留言</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{localWorkers.length}</Text>
          <Text className={styles.statLabel}>工友总数</Text>
        </View>
      </View>

      <View className={styles.workerList}>
        {filteredWorkers.length > 0 ? (
          filteredWorkers.map((worker) => (
            <WorkerCard
              key={worker.id}
              worker={worker}
              onVoicePlay={handleVoicePlay}
              onClick={handleWorkerClick}
            />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emoji}>🔍</Text>
            <Text className={styles.title}>暂无工友</Text>
            <Text className={styles.desc}>该行业暂时没有夜班工友在线</Text>
          </View>
        )}
      </View>

      <Button
        className={classnames(styles.fab, isRecording && styles.recording)}
        onClick={handleFabClick}
      >
        <Text className={styles.icon}>🎤</Text>
        {isRecording && (
          <Text className={styles.recordingText}>录音中 {formatTime(recordingTime)}</Text>
        )}
      </Button>

      {showRecordModal && (
        <View className={styles.recordModal}>
          <View className={styles.wave}>
            {[...Array(10)].map((_, i) => (
              <View key={i} className={styles.waveBar} />
            ))}
          </View>
          <Text className={styles.recordingTime}>{formatTime(recordingTime)}</Text>
          <Text className={styles.tip}>正在录制语音，最长60秒...</Text>
          <View className={styles.actions}>
            <Button className={classnames(styles.btn, styles.cancel)} onClick={handleCancel}>
              <Text>✕</Text>
            </Button>
            <Button className={classnames(styles.btn, styles.send)} onClick={handleSend}>
              <Text>✓</Text>
            </Button>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default CirclePage;
