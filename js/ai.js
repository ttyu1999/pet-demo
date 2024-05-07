// ai.js
async function generateText(prompt) {
  isGPTOutput = true;
  allowSend = false;
  try {
    // 修改为您 Fly.io 或本地服务器的 URL
    const response = await fetch("https://gpt-backend.fly.dev/api/generate-text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (response.ok) {
      const data = await response.json();
      // 使用后端返回的数据
      $(".dialog").removeClass("loading");
      $(".dialog .icon").remove();
      $(".dialog.active p").text(data.content);
      $(".dialog.active time").text(getTime());
      $(".dialog").removeClass("active");
      getMessageHeight();
      isGPTOutput = false;
    } else {
      handleError();
    }
  } catch (error) {
    console.error(error);
    handleError();
  }
}

function handleError() {
  $(".dialog").removeClass("loading");
  $(".dialog .icon").remove();
  $(".dialog.active p").text("OOPS！發生錯誤了QQ");
  $(".dialog.active time").text(getTime());
  $(".dialog").removeClass("active");
  getMessageHeight();
  isGPTOutput = false;
}

let allowSend = false;
let isGPTOutput = false;

const isMobile = /Mobile|Android/.test(navigator.userAgent);

$("#prompt").keydown((e) => {
  if (e.keyCode === 13 && !e.shiftKey && !isMobile) {
    e.preventDefault(); // 防止換行
    if (allowSend) {
      promptText();
    }
  }
});

$("#prompt").on("input", () => {
  if ($("#prompt").val() !== "" && !isGPTOutput) {
    allowSend = true;
  } else {
    allowSend = false;
  }

  if (allowSend) {
    $("#send").addClass("active");
  } else {
    $("#send").removeClass("active");
  }
});

if (allowSend) {
  $("#send").addClass("active");
} else {
  $("#send").removeClass("active");
}

$("#send").click(() => {
  if (allowSend) {
    promptText();
  }
});

const getMessageHeight = () => {
  const dialogList = document.querySelector("#messenger .dialog_list");

  const headerHeight = document.querySelector("#messenger header").offsetHeight;

  const lastMessage = dialogList.lastElementChild;
  const lastMessageTop = lastMessage.offsetTop;

  dialogList.scrollTop = lastMessageTop - headerHeight;
};

const getTime = () => {
  const now = new Date();
  const currentHour = now.getHours().toString().padStart(2, "0");
  const currentMin = now.getMinutes().toString().padStart(2, "0");
  return `${currentHour}:${currentMin}`;
};

const promptText = () => {
  const prompt = $("#prompt").val().trim().replace(/\n/g, "<br>");

  $(".dialog_list").append(`
        <div class="dialog" data-self>
            <div class="txt">
                <p>${prompt}</p>
            </div>
            <time>${getTime()}</time>
        </div>
    `);

  $("#prompt").val("");
  $("#send").removeClass("active");
  allowSend = false;

  getMessageHeight();

  setTimeout(() => {
    $(".dialog_list").append(`
            <div class="dialog loading active">
                <div class="txt">
                    <div class="icon">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <p></p>
                </div>
                <time></time>
            </div>
        `);

    getMessageHeight();
  }, 500);

  generateText(prompt);
};

// async function generateText(prompt) {
//     isGPTOutput = true;
//     allowSend = false;
//     try {
//         const response = await fetch('https://api.openai.com/v1/chat/completions', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${API_KEY}`,
//             },
//             body: JSON.stringify({
//                 model: 'gpt-4',
//                 messages: [
//                     { role: 'system', content: `總是使用「正體中文」回覆，每次回覆字數不得超過50個中文字，請在這50個中文字裡組成完整的句子。

//                     --你的職位：
//                     你是小亭的客服專員，專門回覆客戶所遇到的疑難雜症。回答的語氣不要正式，輕鬆活潑一點，多用一些可愛的表情符號。

//                     --我的經營理念：
//                     小亭是一名前端工程師，因緣際會下接觸到前端這個領域

//                     --我的服務項目：
//                     01.使用者經驗設計
//                     02.資訊架構統籌與規劃
//                     03.網站動線與介面設計
//                     04.系統資料庫開發與整合
//                     05.策略性創意企劃
//                     06.視覺設計及製作
//                     07.程式開發及撰寫
//                     08.資料庫規劃及建置
//                     09.虛擬空間代管服務` },
//                     { role: 'user', content: prompt }
//                 ],
//                 temperature: 1.0,
//                 top_p: 0.7,
//                 n: 1,
//                 stream: false,
//                 presence_penalty: 0,
//                 frequency_penalty: 0,
//             }),
//         });

//         if (response.ok) {
//             const data = await response.json();

//             $('.dialog').removeClass('loading');
//             $('.dialog .icon').remove();
//             $('.dialog.active p').text(data.choices[0].message.content);
//             $('.dialog.active time').text(getTime());
//             $('.dialog').removeClass('active');

//             getMessageHeight();
//             isGPTOutput = false;
//         } else {
//             $('.dialog').removeClass('loading');
//             $('.dialog .icon').remove();
//             $('.dialog.active p').text('OOPS！發生錯誤了QQ');
//             $('.dialog.active time').text(getTime());
//             $('.dialog').removeClass('active');

//             getMessageHeight();
//             isGPTOutput = false;
//         }
//     } catch (error) {
//         console.error(error);
//         $('.dialog').removeClass('loading');
//         $('.dialog .icon').remove();
//         $('.dialog.active p').text('OOPS！發生錯誤了QQ');
//         $('.dialog.active time').text(getTime());
//         $('.dialog').removeClass('active');

//         getMessageHeight();
//         isGPTOutput = false;
//     }
// }
