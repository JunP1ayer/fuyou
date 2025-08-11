// 🌍 コミュニティハブ - 学生間情報共有・求人マッチング

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Avatar,
  AvatarGroup,
  Chip,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Alert,
  Badge,
  Divider,
  Tooltip,
  Menu,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  Search,
  LocationOn,
  Work,
  TrendingUp,
  Chat,
  Star,
  Group,
  School,
  AttachMoney,
  Schedule,
  Share,
  Bookmark,
  Report,
  MoreVert,
  Verified,
  Favorite,
  FavoriteBorder,
  Comment,
  Send,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useUnifiedStore } from '../../store/unifiedStore';
import useI18n from '../../hooks/useI18n';
import { logger, LogCategory } from '../../utils/logger';

// コミュニティデータの型定義
interface CommunityUser {
  id: string;
  name: string;
  avatar: string;
  university: string;
  major: string;
  yearLevel: number; // 1-4年生
  location: string;
  isVerified: boolean;
  reputation: number; // 0-100
  joinedDate: string;
  badges: ('newcomer' | 'helper' | 'expert' | 'reviewer' | 'top_earner')[];
}

interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  hourlyRate: {
    min: number;
    max: number;
  };
  workType: 'part-time' | 'temporary' | 'seasonal' | 'remote';
  category: string;
  description: string;
  requirements: string[];
  benefits: string[];
  schedule: {
    days: string[];
    hours: string;
    flexibility: 'high' | 'medium' | 'low';
  };
  postedBy: string; // user ID
  postedDate: string;
  applicants: number;
  rating: number;
  reviews: JobReview[];
  isBookmarked: boolean;
  matchScore?: number; // AI算出の適合度
}

interface JobReview {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  content: string;
  pros: string[];
  cons: string[];
  wouldRecommend: boolean;
  workDuration: string; // "3ヶ月"等
  position: string;
  date: string;
  likes: number;
  isVerified: boolean; // 勤務証明済み
}

interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: 'question' | 'tip' | 'review' | 'news' | 'discussion';
  title: string;
  content: string;
  tags: string[];
  likes: number;
  comments: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdDate: string;
  lastActivity: string;
  attachments?: {
    type: 'image' | 'document';
    url: string;
    name: string;
  }[];
}

export const CommunityHub: React.FC = () => {
  const { t, formatCurrency } = useI18n();
  const [activeTab, setActiveTab] = useState<'jobs' | 'community' | 'network'>('jobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [jobListings, setJobListings] = useState<JobPosting[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<CommunityUser[]>([]);
  const [filterOptions, setFilterOptions] = useState({
    location: 'all',
    category: 'all',
    minHourlyRate: 800,
    workType: 'all',
  });

  // モックデータ生成
  const mockJobListings: JobPosting[] = useMemo(() => [
    {
      id: '1',
      title: 'カフェスタッフ',
      company: 'スターバックス 渋谷店',
      location: '東京都渋谷区',
      hourlyRate: { min: 1100, max: 1300 },
      workType: 'part-time',
      category: 'カフェ・飲食',
      description: '学生歓迎！シフト制で学業と両立しやすい環境です。充実した研修制度で未経験でも安心。',
      requirements: ['明るく接客が好きな方', '週2日以上勤務可能', '長期勤務歓迎'],
      benefits: ['社割30%', '研修充実', 'スキルアップ支援', '交通費支給'],
      schedule: {
        days: ['月', '火', '水', '木', '金', '土', '日'],
        hours: '7:00-22:00の間でシフト制',
        flexibility: 'high',
      },
      postedBy: 'user123',
      postedDate: '2024-02-01',
      applicants: 23,
      rating: 4.2,
      reviews: [],
      isBookmarked: false,
      matchScore: 92,
    },
    {
      id: '2',
      title: 'データ入力・事務補助',
      company: 'IT企業 新宿オフィス',
      location: '東京都新宿区',
      hourlyRate: { min: 1200, max: 1500 },
      workType: 'part-time',
      category: 'オフィス・事務',
      description: 'PCスキルを活かせる事務のお仕事。在宅勤務も可能で学業との両立がしやすいです。',
      requirements: ['Excel基本操作', 'タイピング得意', 'Word操作可能'],
      benefits: ['在宅勤務可', '平日のみ', 'PCスキル向上', '昇給あり'],
      schedule: {
        days: ['月', '火', '水', '木', '金'],
        hours: '9:00-18:00の間で4-6時間',
        flexibility: 'medium',
      },
      postedBy: 'user456',
      postedDate: '2024-01-28',
      applicants: 15,
      rating: 4.5,
      reviews: [],
      isBookmarked: true,
      matchScore: 87,
    },
    {
      id: '3',
      title: '家庭教師（数学・英語）',
      company: '個別指導塾ベスト',
      location: '東京都世田谷区',
      hourlyRate: { min: 1800, max: 2500 },
      workType: 'part-time',
      category: '教育・塾講師',
      description: '中高生の個別指導をお任せします。自分の得意科目を活かして高時給を実現！',
      requirements: ['大学2年生以上', '数学または英語が得意', '責任感のある方'],
      benefits: ['高時給', 'やりがい大', '教育経験積める', '柔軟なシフト'],
      schedule: {
        days: ['月', '火', '水', '木', '金', '土'],
        hours: '16:00-22:00',
        flexibility: 'high',
      },
      postedBy: 'user789',
      postedDate: '2024-01-25',
      applicants: 8,
      rating: 4.7,
      reviews: [],
      isBookmarked: false,
      matchScore: 78,
    },
  ], []);

  const mockCommunityPosts: CommunityPost[] = useMemo(() => [
    {
      id: '1',
      userId: 'user101',
      userName: '早稲田太郎',
      userAvatar: '/avatars/user101.jpg',
      type: 'tip',
      title: '扶養控除を超えない効率的な働き方のコツ',
      content: '年間123万円の扶養控除限度額を意識しながら、効率的に稼ぐ方法をシェアします！時給の高いバイトを週末に集中させて...',
      tags: ['扶養控除', '時給', '効率', '学業両立'],
      likes: 42,
      comments: 15,
      isLiked: false,
      isBookmarked: true,
      createdDate: '2024-02-01',
      lastActivity: '2024-02-02',
    },
    {
      id: '2',
      userId: 'user202',
      userName: 'みなみ@慶應',
      userAvatar: '/avatars/user202.jpg',
      type: 'question',
      title: 'バイト掛け持ちで年末調整はどうすれば？',
      content: 'カフェとコンビニでバイトをしています。年末調整の手続きで困っています。経験のある方教えてください！',
      tags: ['年末調整', '掛け持ち', '税金', '手続き'],
      likes: 28,
      comments: 23,
      isLiked: true,
      isBookmarked: false,
      createdDate: '2024-01-30',
      lastActivity: '2024-02-01',
    },
    {
      id: '3',
      userId: 'user303',
      userName: 'けんた@明治',
      userAvatar: '/avatars/user303.jpg',
      type: 'review',
      title: 'ファミマバイト3ヶ月働いた感想',
      content: '深夜シフト中心で働きました。時給は良いけど体力的にはキツイ。学業との両立を考えると...',
      tags: ['ファミリーマート', 'コンビニ', '深夜', '体験談'],
      likes: 35,
      comments: 18,
      isLiked: false,
      isBookmarked: false,
      createdDate: '2024-01-28',
      lastActivity: '2024-01-31',
    },
  ], []);

  // フィルタリング機能
  const filteredJobs = useMemo(() => {
    return mockJobListings.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.company.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLocation = filterOptions.location === 'all' || 
                            job.location.includes(filterOptions.location);
      const matchesCategory = filterOptions.category === 'all' || 
                            job.category === filterOptions.category;
      const matchesRate = job.hourlyRate.max >= filterOptions.minHourlyRate;
      const matchesType = filterOptions.workType === 'all' || 
                        job.workType === filterOptions.workType;
      
      return matchesSearch && matchesLocation && matchesCategory && matchesRate && matchesType;
    });
  }, [mockJobListings, searchQuery, filterOptions]);

  // AI求人マッチング機能
  const getMatchScore = (job: JobPosting): number => {
    // ユーザーの過去の勤務歴、スキル、希望条件に基づいてマッチング度を計算
    // この例では簡略化
    let score = 50;
    
    // 時給の魅力度
    if (job.hourlyRate.max > 1500) score += 20;
    if (job.hourlyRate.max > 2000) score += 10;
    
    // スケジュールの柔軟性
    if (job.schedule.flexibility === 'high') score += 15;
    
    // レビュー評価
    score += Math.round(job.rating * 5);
    
    return Math.min(100, Math.max(0, score));
  };

  // 求人詳細表示
  const handleJobClick = (job: JobPosting) => {
    setSelectedJob(job);
    setJobDialogOpen(true);
    logger.info(LogCategory.UI, 'Job posting viewed', { jobId: job.id, title: job.title });
  };

  // ブックマーク切り替え
  const toggleBookmark = (jobId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setJobListings(prev => prev.map(job => 
      job.id === jobId ? { ...job, isBookmarked: !job.isBookmarked } : job
    ));
    logger.info(LogCategory.UI, 'Job bookmark toggled', { jobId });
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      {/* ヘッダー */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          🌍 学生コミュニティ
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          求人情報・体験談共有・学生同士のネットワーク
        </Typography>

        {/* タブナビゲーション */}
        <Tabs 
          value={activeTab} 
          onChange={(_, newTab) => setActiveTab(newTab)}
          centered
          sx={{ mb: 3 }}
        >
          <Tab label="💼 求人情報" value="jobs" />
          <Tab label="💬 コミュニティ" value="community" />
          <Tab label="🤝 ネットワーク" value="network" />
        </Tabs>
      </Box>

      {/* 求人情報タブ */}
      {activeTab === 'jobs' && (
        <Box>
          {/* 検索・フィルター */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="求人を検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    select
                    fullWidth
                    label="エリア"
                    value={filterOptions.location}
                    onChange={(e) => setFilterOptions(prev => ({ ...prev, location: e.target.value }))}
                  >
                    <MenuItem value="all">すべて</MenuItem>
                    <MenuItem value="渋谷区">渋谷区</MenuItem>
                    <MenuItem value="新宿区">新宿区</MenuItem>
                    <MenuItem value="世田谷区">世田谷区</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    select
                    fullWidth
                    label="職種"
                    value={filterOptions.category}
                    onChange={(e) => setFilterOptions(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <MenuItem value="all">すべて</MenuItem>
                    <MenuItem value="カフェ・飲食">カフェ・飲食</MenuItem>
                    <MenuItem value="オフィス・事務">オフィス・事務</MenuItem>
                    <MenuItem value="教育・塾講師">教育・塾講師</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">最低時給:</Typography>
                    <TextField
                      type="number"
                      size="small"
                      value={filterOptions.minHourlyRate}
                      onChange={(e) => setFilterOptions(prev => ({ 
                        ...prev, 
                        minHourlyRate: parseInt(e.target.value) || 800 
                      }))}
                      sx={{ width: 100 }}
                    />
                    <Typography variant="body2">円</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* AI推奨求人 */}
          <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  🤖 AI推奨求人
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                あなたのスキルと条件に最適な求人をAIが選出しました
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {filteredJobs.slice(0, 3).map(job => (
                  <Chip
                    key={job.id}
                    label={`${job.title} (適合度${job.matchScore}%)`}
                    onClick={() => handleJobClick(job)}
                    sx={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                      color: 'white',
                      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.3)' }
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* 求人リスト */}
          <Grid container spacing={2}>
            {filteredJobs.map((job, index) => (
              <Grid item xs={12} md={6} key={job.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    sx={{ 
                      cursor: 'pointer', 
                      transition: 'all 0.3s',
                      '&:hover': { 
                        transform: 'translateY(-4px)',
                        boxShadow: 3,
                      }
                    }}
                    onClick={() => handleJobClick(job)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {job.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {job.company}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {job.location}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {job.matchScore && (
                            <Chip 
                              label={`適合度${job.matchScore}%`} 
                              size="small"
                              color={job.matchScore > 85 ? 'success' : job.matchScore > 70 ? 'primary' : 'default'}
                            />
                          )}
                          <IconButton
                            size="small"
                            onClick={(e) => toggleBookmark(job.id, e)}
                          >
                            {job.isBookmarked ? <Bookmark color="primary" /> : <Bookmark />}
                          </IconButton>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AttachMoney sx={{ fontSize: 18, color: 'success.main' }} />
                          <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                            {formatCurrency(job.hourlyRate.min)}-{formatCurrency(job.hourlyRate.max)}/時
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                          <Typography variant="body2">
                            {job.rating.toFixed(1)}
                          </Typography>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary">
                          応募者{job.applicants}名
                        </Typography>
                      </Box>

                      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                        {job.description.length > 100 
                          ? `${job.description.substring(0, 100)}...` 
                          : job.description
                        }
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                        {job.benefits.slice(0, 3).map((benefit, idx) => (
                          <Chip 
                            key={idx} 
                            label={benefit} 
                            size="small" 
                            variant="outlined"
                          />
                        ))}
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          {job.schedule.flexibility === 'high' ? '🟢' : 
                           job.schedule.flexibility === 'medium' ? '🟡' : '🔴'} 
                          シフト調整{job.schedule.flexibility === 'high' ? '可' : 
                                 job.schedule.flexibility === 'medium' ? '相談' : '不可'}
                        </Typography>
                        
                        <Typography variant="caption" color="text.secondary">
                          {new Date(job.postedDate).toLocaleDateString('ja-JP')}投稿
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* コミュニティタブ */}
      {activeTab === 'community' && (
        <Box>
          <Grid container spacing={3}>
            {mockCommunityPosts.map((post, index) => (
              <Grid item xs={12} key={post.id}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'start', mb: 2 }}>
                        <Avatar src={post.userAvatar} sx={{ mr: 2 }}>
                          {post.userName[0]}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {post.userName}
                            </Typography>
                            <Chip 
                              label={post.type === 'tip' ? '💡Tips' : 
                                   post.type === 'question' ? '❓質問' :
                                   post.type === 'review' ? '📝体験談' : '💬議論'}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(post.createdDate).toLocaleDateString('ja-JP')}
                          </Typography>
                        </Box>
                        <IconButton size="small">
                          <MoreVert />
                        </IconButton>
                      </Box>

                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {post.title}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                        {post.content}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
                        {post.tags.map((tag, idx) => (
                          <Chip 
                            key={idx} 
                            label={`#${tag}`} 
                            size="small" 
                            variant="outlined"
                          />
                        ))}
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                          size="small"
                          startIcon={post.isLiked ? <Favorite color="error" /> : <FavoriteBorder />}
                          color={post.isLiked ? 'error' : 'inherit'}
                        >
                          {post.likes}
                        </Button>
                        <Button size="small" startIcon={<Comment />}>
                          {post.comments}件のコメント
                        </Button>
                        <Button size="small" startIcon={<Share />}>
                          共有
                        </Button>
                        <Box sx={{ ml: 'auto' }}>
                          <IconButton size="small">
                            {post.isBookmarked ? <Bookmark color="primary" /> : <Bookmark />}
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* ネットワークタブ */}
      {activeTab === 'network' && (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center' }}>
                    <Group sx={{ mr: 1 }} />
                    近くの学生
                  </Typography>
                  
                  <List>
                    {[
                      { name: '田中花子', university: '早稲田大学', major: '商学部', distance: '0.5km' },
                      { name: '佐藤次郎', university: '慶應義塾大学', major: '経済学部', distance: '1.2km' },
                      { name: '鈴木美咲', university: '明治大学', major: '文学部', distance: '1.8km' },
                    ].map((user, idx) => (
                      <ListItem key={idx}>
                        <ListItemAvatar>
                          <Avatar>{user.name[0]}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={user.name}
                          secondary={`${user.university} ${user.major} (${user.distance})`}
                        />
                        <ListItemSecondaryAction>
                          <Button size="small" variant="outlined">
                            つながる
                          </Button>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center' }}>
                    <School sx={{ mr: 1 }} />
                    大学別統計
                  </Typography>
                  
                  {[
                    { university: '早稲田大学', students: 234, avgEarnings: 85000 },
                    { university: '慶應義塾大学', students: 198, avgEarnings: 92000 },
                    { university: '明治大学', students: 156, avgEarnings: 78000 },
                    { university: '立教大学', students: 143, avgEarnings: 81000 },
                  ].map((stat, idx) => (
                    <Box key={idx} sx={{ mb: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {stat.university}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stat.students}名参加
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="success.main">
                        平均月収: {formatCurrency(stat.avgEarnings)}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* 求人詳細ダイアログ */}
      <Dialog 
        open={jobDialogOpen} 
        onClose={() => setJobDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedJob && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {selectedJob.title}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    {selectedJob.company}
                  </Typography>
                </Box>
                <Chip 
                  label={`適合度${selectedJob.matchScore}%`}
                  color={selectedJob.matchScore! > 85 ? 'success' : 'primary'}
                />
              </Box>
            </DialogTitle>
            
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      💰 給与・条件
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'success.main', fontWeight: 600, mb: 1 }}>
                      時給 {formatCurrency(selectedJob.hourlyRate.min)}-{formatCurrency(selectedJob.hourlyRate.max)}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      📍 {selectedJob.location}
                    </Typography>
                    <Typography variant="body2">
                      🕐 {selectedJob.schedule.hours}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      📝 仕事内容
                    </Typography>
                    <Typography variant="body2">
                      {selectedJob.description}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      ✅ 応募条件
                    </Typography>
                    <List dense>
                      {selectedJob.requirements.map((req, idx) => (
                        <ListItem key={idx} sx={{ py: 0 }}>
                          <Typography variant="body2">• {req}</Typography>
                        </ListItem>
                      ))}
                    </List>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      🎁 待遇・福利厚生
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {selectedJob.benefits.map((benefit, idx) => (
                        <Chip key={idx} label={benefit} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  現在 {selectedJob.applicants}名が応募中
                </Typography>
                <Rating value={selectedJob.rating} precision={0.1} readOnly size="small" />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  {selectedJob.rating.toFixed(1)} / 5.0
                </Typography>
              </Box>
            </DialogContent>
            
            <DialogActions>
              <Button onClick={() => setJobDialogOpen(false)}>
                閉じる
              </Button>
              <Button 
                variant="contained" 
                startIcon={<Send />}
                onClick={() => {
                  logger.info(LogCategory.UI, 'Job application started', { 
                    jobId: selectedJob.id, 
                    title: selectedJob.title 
                  });
                  setJobDialogOpen(false);
                }}
              >
                応募する
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};