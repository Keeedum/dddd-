import { useEffect, useState } from 'react';

export default function LineSchedulerApp() {
  const [schedules, setSchedules] = useState(() => {
    const saved = localStorage.getItem('line_schedules');

    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 1,
            time: '08:00',
            message: 'สวัสดีตอนเช้า 🌤️',
            enabled: true,
          },
          {
            id: 2,
            time: '13:00',
            message: 'พักทานข้าวด้วยนะ 🍜',
            enabled: true,
          },
          {
            id: 3,
            time: '18:00',
            message: 'เลิกงานแล้วพักผ่อน 🌙',
            enabled: false,
          },
        ];
  });

  const [token, setToken] = useState(
    localStorage.getItem('line_token') || ''
  );

  const [userId, setUserId] = useState(
    localStorage.getItem('line_user_id') || ''
  );

  const [tokenStatus, setTokenStatus] = useState('ยังไม่ได้ตรวจสอบ');

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('dark_mode') === 'true';
  });

  const [notification, setNotification] = useState('');

  const [lastSent, setLastSent] = useState([
    { id: 1, status: 'ยังไม่ส่ง' },
    { id: 2, status: 'ยังไม่ส่ง' },
    { id: 3, status: 'ยังไม่ส่ง' },
  ]);

  useEffect(() => {
    localStorage.setItem('line_schedules', JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem('line_token', token);
  }, [token]);

  useEffect(() => {
    localStorage.setItem('line_user_id', userId);
  }, [userId]);

  useEffect(() => {
    localStorage.setItem('dark_mode', String(darkMode));
  }, [darkMode]);

  const updateSchedule = (id, field, value) => {
    setSchedules((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const toggleSchedule = (id) => {
    setSchedules((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, enabled: !item.enabled }
          : item
      )
    );
  };

  const deleteSchedule = (id) => {
    setSchedules((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              message: '',
              enabled: false,
            }
          : item
      )
    );
  };

  const saveSettings = () => {
    localStorage.setItem('line_schedules', JSON.stringify(schedules));
    localStorage.setItem('line_token', token);
    localStorage.setItem('line_user_id', userId);

    setNotification('✅ บันทึกข้อมูลเรียบร้อย');

    setTimeout(() => {
      setNotification('');
    }, 2500);
  };

  const checkToken = async () => {
    if (!token) {
      setTokenStatus('กรุณาใส่ Token');
      return;
    }

    try {
      setTokenStatus('กำลังตรวจสอบ...');

      const response = await fetch('https://api.line.me/v2/bot/info', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setTokenStatus('✅ Token ใช้งานได้');
      } else {
        setTokenStatus('❌ Token ไม่ถูกต้อง');
      }
    } catch (error) {
      setTokenStatus('⚠️ ตรวจสอบไม่ได้');
    }
  };

  const sendMessage = async (id, message) => {
    try {
      if (!userId || !token) {
        setLastSent((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: '❌ กรุณาใส่ Token และ User ID',
                }
              : item
          )
        );

        return;
      }

      const response = await fetch(
        'https://api.line.me/v2/bot/message/push',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            to: userId,
            messages: [
              {
                type: 'text',
                text: message,
              },
            ],
          }),
        }
      );

      if (response.ok) {
        const currentTime = new Date().toLocaleTimeString();

        setLastSent((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: `✅ ส่งสำเร็จ ${currentTime}`,
                }
              : item
          )
        );

        setNotification('✅ ส่งข้อความ LINE สำเร็จ');

        setTimeout(() => {
          setNotification('');
        }, 2500);
      } else {
        setLastSent((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: '❌ ส่งข้อความไม่สำเร็จ',
                }
              : item
          )
        );
      }
    } catch (error) {
      setLastSent((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: '⚠️ เกิดข้อผิดพลาด',
              }
            : item
        )
      );
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);

      schedules.forEach((item) => {
        const sentKey = `sent_${item.id}_${currentTime}`;
        const alreadySent = localStorage.getItem(sentKey);

        if (
          item.enabled &&
          item.time === currentTime &&
          !alreadySent &&
          item.message
        ) {
          sendMessage(item.id, item.message);
          localStorage.setItem(sentKey, 'true');
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [schedules, token, userId]);

  return (
    <div
      className={`min-h-screen flex justify-center items-center p-4 transition-all duration-500 ${
        darkMode
          ? 'bg-gradient-to-b from-gray-950 via-black to-gray-900'
          : 'bg-gradient-to-b from-green-100 via-white to-emerald-50'
      }`}
    >
      <div
        className={`w-full max-w-sm rounded-[34px] shadow-2xl overflow-hidden border transition-all duration-500 ${
          darkMode
            ? 'bg-gray-900 border-gray-700'
            : 'bg-white border-green-100'
        }`}
      >
        <div className="bg-gradient-to-r from-green-500 to-emerald-400 p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">LINE Auto Sender</h1>
              <p className="text-sm opacity-90 mt-1">
                แอปส่งข้อความอัตโนมัติ
              </p>
            </div>

            <div className="bg-white/20 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl">
              💬
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {notification && (
            <div className="bg-green-500 text-white text-center py-3 rounded-2xl font-semibold shadow-lg animate-pulse">
              {notification}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h2
                className={`font-bold text-lg ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}
              >
                Dark Mode 🌙
              </h2>
              <p
                className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                เปิด / ปิดโหมดกลางคืน
              </p>
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-14 h-8 rounded-full transition flex items-center px-1 ${
                darkMode
                  ? 'bg-green-500 justify-end'
                  : 'bg-gray-300 justify-start'
              }`}
            >
              <div className="w-6 h-6 bg-white rounded-full shadow-md"></div>
            </button>
          </div>

          <div
            className={`rounded-3xl p-4 shadow-sm border ${
              darkMode
                ? 'bg-gray-800 border-gray-700'
                : 'bg-green-50 border-green-100'
            }`}
          >
            <h2
              className={`font-semibold mb-3 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}
            >
              เชื่อมต่อ LINE API
            </h2>

            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="LINE Channel Access Token"
              className="w-full p-3 rounded-2xl border border-green-200 outline-none focus:ring-2 focus:ring-green-400 text-sm mb-3"
            />

            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="LINE User ID"
              className="w-full p-3 rounded-2xl border border-green-200 outline-none focus:ring-2 focus:ring-green-400 text-sm"
            />

            <button
              onClick={checkToken}
              className="w-full mt-3 bg-green-500 hover:bg-green-600 transition text-white rounded-2xl py-3 font-medium shadow-md"
            >
              ตรวจสอบ Token LINE
            </button>

            <div
              className={`mt-3 text-sm font-medium text-center rounded-2xl py-2 border ${
                darkMode
                  ? 'bg-gray-900 border-gray-700 text-white'
                  : 'bg-white border-green-100 text-gray-700'
              }`}
            >
              {tokenStatus}
            </div>
          </div>

          {schedules.map((item, index) => (
            <div
              key={item.id}
              className={`rounded-3xl border shadow-xl p-4 transition-all duration-300 ${
                darkMode
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-100'
              }`}
            >
              <div className="flex justify-between items-center mb-4 gap-3">
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}
                  >
                    เวลา #{index + 1}
                  </p>

                  <div className="bg-gradient-to-r from-green-500 to-emerald-400 p-4 rounded-2xl shadow-lg">
                    <input
                      type="time"
                      value={item.time}
                      onChange={(e) =>
                        updateSchedule(item.id, 'time', e.target.value)
                      }
                      className="text-3xl font-bold text-white bg-transparent outline-none tracking-wider w-full"
                    />
                  </div>
                </div>

                <button
                  onClick={() => toggleSchedule(item.id)}
                  className={`w-14 h-8 rounded-full transition flex items-center px-1 ${
                    item.enabled
                      ? 'bg-green-500 justify-end'
                      : 'bg-gray-300 justify-start'
                  }`}
                >
                  <div className="w-6 h-6 bg-white rounded-full"></div>
                </button>
              </div>

              <div
                className={`mb-2 text-xs font-medium ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}
              >
                สถานะล่าสุด:{' '}
                {lastSent.find((s) => s.id === item.id)?.status}
              </div>

              <textarea
                value={item.message}
                onChange={(e) =>
                  updateSchedule(item.id, 'message', e.target.value)
                }
                rows={3}
                placeholder="พิมพ์ข้อความที่ต้องการส่ง"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:ring-2 focus:ring-green-300 resize-none"
              />

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    saveSettings();
                    sendMessage(item.id, item.message);
                  }}
                  className="flex-1 py-3 rounded-2xl bg-green-500 hover:bg-green-600 transition text-white font-medium"
                >
                  ทดสอบส่ง
                </button>

                <button
                  onClick={() => deleteSchedule(item.id)}
                  className="flex-1 py-3 rounded-2xl bg-red-100 hover:bg-red-200 transition text-red-500 font-medium"
                >
                  ล้าง
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={saveSettings}
            className="w-full bg-black hover:bg-gray-900 transition text-white rounded-3xl py-4 font-semibold text-lg shadow-xl"
          >
            เริ่มระบบส่งข้อความอัตโนมัติ 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
