'use client';

import { useState } from 'react';
import styles from './CommunicationHub.module.scss';
import { FaBell, FaEnvelope, FaComments, FaLock, FaStar } from 'react-icons/fa';
import { useAuth } from '@/app/context/AuthContext';

const CommunicationHub = () => {
  const { user } = useAuth();
  const isPremiumUser = user?.plan !== 'free';
  const [activeTab, setActiveTab] = useState('fee-reminders');

  const tabs = [
    { id: 'fee-reminders', label: 'Fee Reminders', icon: <FaEnvelope /> },
    { id: 'attendance-alerts', label: 'Attendance Alerts', icon: <FaBell /> },
    { id: 'teacher-parent-chat', label: 'Teacher-Parent Chat', icon: <FaComments /> },
  ];

  // Show upgrade prompt if not premium user
  if (!isPremiumUser) {
    return (
      <div className={styles.container}>
        <div className={styles.upgradePrompt}>
          <h2>This feature is available for Premium users only</h2>
          <p>Upgrade to Premium to access the Communication & Notification Hub</p>
          <button 
            className={styles.upgradeBtn}
            onClick={() => window.location.href = '/upgrade'}
          >
            Upgrade Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Communication & Notification Hub</h1>
        <p className={styles.subtitle}>Manage communications with parents and students</p>
      </div>

      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.content}>
        {activeTab === 'fee-reminders' && <FeeRemindersTab />}
        {activeTab === 'attendance-alerts' && <AttendanceAlertsTab />}
        {activeTab === 'teacher-parent-chat' && <TeacherParentChatTab />}
      </div>
    </div>
  );
};

// Fee Reminders Tab Component
const FeeRemindersTab = () => {
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [classFilter, setClassFilter] = useState('');
  const [dueDateFilter, setDueDateFilter] = useState('');

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedStudents([1, 2]); // In a real app, this would be all student IDs
    } else {
      setSelectedStudents([]);
    }
  };

  const toggleStudentSelection = (id: number) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter(studentId => studentId !== id));
    } else {
      setSelectedStudents([...selectedStudents, id]);
    }
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <h2>Fee Reminders</h2>
        <p>Send automated reminders to parents with pending dues</p>
      </div>
      
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label htmlFor="classFilter">Class:</label>
          <select 
            id="classFilter" 
            className={styles.select}
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="">All Classes</option>
            <option value="1">Class 1</option>
            <option value="2">Class 2</option>
            <option value="3">Class 3</option>
            <option value="4">Class 4</option>
            <option value="5">Class 5</option>
          </select>
        </div>
        
        <div className={styles.filterGroup}>
          <label htmlFor="dueDateFilter">Due Date:</label>
          <select 
            id="dueDateFilter" 
            className={styles.select}
            value={dueDateFilter}
            onChange={(e) => setDueDateFilter(e.target.value)}
          >
            <option value="overdue">Overdue</option>
            <option value="this-month">This Month</option>
            <option value="next-week">Next Week</option>
          </select>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>
                <input 
                  type="checkbox" 
                  className={styles.checkbox} 
                  onChange={toggleSelectAll}
                  checked={selectedStudents.length === 2} // In a real app, this would be total count
                />
              </th>
              <th>Student Name</th>
              <th>Class</th>
              <th>Parent Email</th>
              <th>Amount Due</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <input 
                  type="checkbox" 
                  className={styles.checkbox} 
                  checked={selectedStudents.includes(1)}
                  onChange={() => toggleStudentSelection(1)}
                />
              </td>
              <td>Rahul Sharma</td>
              <td>Class 5</td>
              <td>rahul.parents@email.com</td>
              <td>$250</td>
              <td>Dec 15, 2024</td>
              <td><span className={`${styles.status} ${styles.overdue}`}>Overdue</span></td>
            </tr>
            <tr>
              <td>
                <input 
                  type="checkbox" 
                  className={styles.checkbox} 
                  checked={selectedStudents.includes(2)}
                  onChange={() => toggleStudentSelection(2)}
                />
              </td>
              <td>Priya Patel</td>
              <td>Class 4</td>
              <td>priya.parents@email.com</td>
              <td>$300</td>
              <td>Dec 20, 2024</td>
              <td><span className={`${styles.status} ${styles.pending}`}>Pending</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={styles.actions}>
        <button className={styles.sendReminderBtn}>
          Send Selected Reminders ({selectedStudents.length})
        </button>
        <button className={styles.sendBulkBtn}>
          Send Bulk Reminder to All
        </button>
      </div>
    </div>
  );
};

// Attendance Alerts Tab Component
const AttendanceAlertsTab = () => {
  const [settings, setSettings] = useState({
    absentNotification: true,
    lateNotification: true,
    dailySummary: false,
  });

  const handleSettingChange = (setting: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <h2>Attendance Alerts</h2>
        <p>Configure automatic notifications for attendance</p>
      </div>
      
      <div className={styles.alertSettings}>
        <div className={styles.settingItem}>
          <div className={styles.settingInfo}>
            <h3>Send Alert When Student is Absent</h3>
            <p>Parents will receive immediate notification when their child is marked absent</p>
          </div>
          <div className={styles.toggleSwitch}>
            <input 
              type="checkbox" 
              id="absentToggle" 
              className={styles.toggleInput} 
              checked={settings.absentNotification}
              onChange={() => handleSettingChange('absentNotification')}
            />
            <label htmlFor="absentToggle" className={styles.toggleLabel}></label>
          </div>
        </div>
        
        <div className={styles.settingItem}>
          <div className={styles.settingInfo}>
            <h3>Send Alert When Student is Late</h3>
            <p>Parents will receive notification when their child arrives late</p>
          </div>
          <div className={styles.toggleSwitch}>
            <input 
              type="checkbox" 
              id="lateToggle" 
              className={styles.toggleInput} 
              checked={settings.lateNotification}
              onChange={() => handleSettingChange('lateNotification')}
            />
            <label htmlFor="lateToggle" className={styles.toggleLabel}></label>
          </div>
        </div>
        
        <div className={styles.settingItem}>
          <div className={styles.settingInfo}>
            <h3>Daily Attendance Summary</h3>
            <p>Send daily summary of attendance to all parents</p>
          </div>
          <div className={styles.toggleSwitch}>
            <input 
              type="checkbox" 
              id="summaryToggle" 
              className={styles.toggleInput} 
              checked={settings.dailySummary}
              onChange={() => handleSettingChange('dailySummary')}
            />
            <label htmlFor="summaryToggle" className={styles.toggleLabel}></label>
          </div>
        </div>
      </div>
      
      <div className={styles.recentAlerts}>
        <h3>Recent Notifications Sent</h3>
        <div className={styles.alertList}>
          <div className={styles.alertItem}>
            <div className={styles.alertContent}>
              <strong>Rahul Sharma</strong> marked absent today
            </div>
            <div className={styles.alertTime}>Today, 09:15 AM</div>
          </div>
          <div className={styles.alertItem}>
            <div className={styles.alertContent}>
              <strong>Priya Patel</strong> marked late today
            </div>
            <div className={styles.alertTime}>Yesterday, 08:45 AM</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Teacher-Parent Chat Tab Component
const TeacherParentChatTab = () => {
  const [selectedConversation, setSelectedConversation] = useState(0);
  const [messageText, setMessageText] = useState('');
  const [conversations] = useState([
    { id: 1, name: 'Rahul Sharma (Parent)', lastMessage: 'Hi, how is Rahul doing?', time: '10:30 AM', unread: 1 },
    { id: 2, name: 'Priya Patel (Parent)', lastMessage: 'Thanks for the update!', time: 'Yesterday', unread: 0 },
    { id: 3, name: 'Amit Kumar (Parent)', lastMessage: 'Can we schedule a meeting?', time: 'Dec 18', unread: 0 },
  ]);

  const handleSendMessage = () => {
    if (messageText.trim()) {
      // In a real app, this would send the message to the backend
      console.log('Sending message:', messageText);
      setMessageText('');
    }
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <h2>Teacher-Parent Chat</h2>
        <p>Direct communication between teachers and parents</p>
      </div>
      
      <div className={styles.chatContainer}>
        <div className={styles.chatSidebar}>
          <div className={styles.searchContainer}>
            <input 
              type="text" 
              placeholder="Search parents..." 
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.classSelector}>
            <label>Select Class:</label>
            <select className={styles.select}>
              <option>All Classes</option>
              <option>Class 1</option>
              <option>Class 2</option>
              <option>Class 3</option>
              <option>Class 4</option>
              <option>Class 5</option>
            </select>
          </div>
          
          <div className={styles.conversationList}>
            {conversations.map((conversation, index) => (
              <div 
                key={conversation.id}
                className={`${styles.conversationItem} ${selectedConversation === index ? styles.activeConversation : ''}`}
                onClick={() => setSelectedConversation(index)}
              >
                <div className={styles.avatar}>
                  {conversation.name.charAt(0)}
                </div>
                <div className={styles.conversationInfo}>
                  <div className={styles.conversationName}>
                    {conversation.name}
                    {conversation.unread > 0 && (
                      <span className={styles.unreadBadge}>{conversation.unread}</span>
                    )}
                  </div>
                  <div className={styles.lastMessage}>{conversation.lastMessage}</div>
                </div>
                <div className={styles.messageTime}>{conversation.time}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className={styles.chatArea}>
          {conversations[selectedConversation] ? (
            <>
              <div className={styles.chatHeader}>
                <div className={styles.chatUserInfo}>
                  <div className={styles.avatar}>
                    {conversations[selectedConversation].name.charAt(0)}
                  </div>
                  <div>
                    <div className={styles.userName}>{conversations[selectedConversation].name}</div>
                    <div className={styles.userStatus}>Online</div>
                  </div>
                </div>
              </div>
              
              <div className={styles.messagesContainer}>
                <div className={`${styles.message} ${styles.received}`}>
                  <div className={styles.messageContent}>
                    Hi, how is Rahul doing?
                  </div>
                  <div className={styles.messageTime}>10:25 AM</div>
                </div>
                
                <div className={`${styles.message} ${styles.sent}`}>
                  <div className={styles.messageContent}>
                    Hello! Rahul is doing well. He participated actively in today's math class.
                  </div>
                  <div className={styles.messageTime}>10:30 AM</div>
                </div>
                
                <div className={`${styles.message} ${styles.received}`}>
                  <div className={styles.messageContent}>
                    That's great to hear! Thanks for the update.
                  </div>
                  <div className={styles.messageTime}>10:32 AM</div>
                </div>
              </div>
              
              <div className={styles.messageInputContainer}>
                <textarea 
                  placeholder="Type your message..."
                  className={styles.messageInput}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                ></textarea>
                <button 
                  className={styles.sendMessageBtn}
                  onClick={handleSendMessage}
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className={styles.emptyChat}>
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunicationHub;