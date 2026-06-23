import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "qrupchat_v2";

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { groups: {}, messages: {} };
  } catch { return { groups: {}, messages: {} }; }
}
function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

const EMOJIS = ["😀","😂","🥰","😎","😭","😡","🤔","😴","🥳","😇","👍","👎","❤️","🔥","🎉","✅","💯","🙏","👏","💪","😮","😱","🤣","😜","🫡","🤩","😏","🥺","😤","🤗","🍕","🍔","☕","🎵","⚽","🎮","🚀","🌙","⭐","🌈","💀","👻","🤖","🦋","🐶","🐱","🌺","🍀","💎","🎁"];

const COLORS = ["#6C63FF","
