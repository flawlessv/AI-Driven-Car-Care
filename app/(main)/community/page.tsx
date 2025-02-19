'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  List,
  Space,
  Tag,
  Button,
  Input,
  Select,
  Tabs,
  Avatar,
  Typography,
  message,
} from 'antd';
import {
  LikeOutlined,
  MessageOutlined,
  EyeOutlined,
  ShareAltOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { Post, KnowledgeArticle } from '@/types/community';

const { Title, Text } = Typography;
const { Search } = Input;
const { TabPane } = Tabs;

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: undefined,
    category: undefined,
    tags: [],
  });

  useEffect(() => {
    fetchData();
  }, [activeTab, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'posts') {
        const response = await fetch('/api/community/posts');
        const data = await response.json();
        setPosts(data.data || []);
      } else if (activeTab === 'knowledge') {
        const response = await fetch('/api/community/articles');
        const data = await response.json();
        setArticles(data.data || []);
      }
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    // TODO: 实现搜索功能
  };

  const handleFilterChange = (type: string, value: any) => {
    setFilters(prev => ({ ...prev, [type]: value }));
  };

  const renderPostItem = (item: Post) => (
    <List.Item
      key={item._id}
      actions={[
        <Space key="actions">
          <Button type="text" icon={<LikeOutlined />}>
            {item.likes}
          </Button>
          <Button type="text" icon={<MessageOutlined />}>
            {item.comments.length}
          </Button>
          <Button type="text" icon={<EyeOutlined />}>
            {item.views}
          </Button>
          <Button type="text" icon={<ShareAltOutlined />} />
        </Space>,
      ]}
    >
      <List.Item.Meta
        avatar={<Avatar src={item.author.avatar} />}
        title={
          <Space>
            <a href={`/community/posts/${item._id}`}>{item.title}</a>
            <Tag color="blue">{item.type}</Tag>
            {item.tags.map(tag => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Space>
        }
        description={
          <Space direction="vertical">
            <Text type="secondary">
              {item.author.name} · {new Date(item.createdAt).toLocaleString()}
            </Text>
            <Text>{item.content.slice(0, 200)}...</Text>
          </Space>
        }
      />
    </List.Item>
  );

  const renderArticleItem = (item: KnowledgeArticle) => (
    <List.Item
      key={item._id}
      actions={[
        <Space key="actions">
          <Button type="text" icon={<LikeOutlined />}>
            {item.likes}
          </Button>
          <Button type="text" icon={<EyeOutlined />}>
            {item.views}
          </Button>
          <Button type="text" icon={<ShareAltOutlined />} />
        </Space>,
      ]}
    >
      <List.Item.Meta
        title={
          <Space>
            <a href={`/community/knowledge/${item._id}`}>{item.title}</a>
            <Tag color="green">{item.category}</Tag>
            {item.tags.map(tag => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Space>
        }
        description={
          <Space direction="vertical">
            <Text type="secondary">
              {item.author.name} · {new Date(item.createdAt).toLocaleString()}
            </Text>
            <Text>{item.content.slice(0, 200)}...</Text>
          </Space>
        }
      />
    </List.Item>
  );

  return (
    <div className="p-6">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Space direction="vertical" className="w-full">
              <Row justify="space-between" align="middle">
                <Col>
                  <Title level={2}>社区</Title>
                </Col>
                <Col>
                  <Button type="primary" icon={<PlusOutlined />}>
                    发布内容
                  </Button>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col flex="auto">
                  <Search
                    placeholder="搜索内容..."
                    onSearch={handleSearch}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col>
                  <Select
                    placeholder="内容类型"
                    style={{ width: 120 }}
                    onChange={value => handleFilterChange('type', value)}
                  >
                    <Select.Option value="experience">经验分享</Select.Option>
                    <Select.Option value="question">问题咨询</Select.Option>
                    <Select.Option value="knowledge">知识</Select.Option>
                  </Select>
                </Col>
                <Col>
                  <Select
                    placeholder="分类"
                    style={{ width: 120 }}
                    onChange={value => handleFilterChange('category', value)}
                  >
                    <Select.Option value="maintenance">保养</Select.Option>
                    <Select.Option value="repair">维修</Select.Option>
                    <Select.Option value="modification">改装</Select.Option>
                  </Select>
                </Col>
              </Row>
            </Space>
          </Card>
        </Col>

        <Col span={24}>
          <Card>
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane tab="全部帖子" key="posts">
                <List
                  loading={loading}
                  itemLayout="vertical"
                  dataSource={posts}
                  renderItem={renderPostItem}
                  pagination={{
                    pageSize: 10,
                    total: posts.length,
                  }}
                />
              </TabPane>
              <TabPane tab="知识库" key="knowledge">
                <List
                  loading={loading}
                  itemLayout="vertical"
                  dataSource={articles}
                  renderItem={renderArticleItem}
                  pagination={{
                    pageSize: 10,
                    total: articles.length,
                  }}
                />
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
} 