"use strict";

const init = document.getElementById('init');
const load = document.getElementById('load');
const carousel = document.createElement("main");
let carousel_fragment = document.createDocumentFragment();
carousel.classList.add("scroll-container");
load.addEventListener('change', read_file);
let progress = document.getElementById("progress");

let sections = [];
let current_section = 0;

const prev = document.createElement("button");
const next = document.createElement("button");

async function createFile(path){
  let response = await fetch(path);
  let data = await response.blob();
  let metadata = {
    type: 'text/plain'
  };
  let file = new File([data], path, metadata);
  
  let reader = new FileReader();
  reader.onload = process_file;
  reader.readAsText(file);
}

function read_file() {
    // document.body.requestFullscreen();
    let reader = new FileReader();
    reader.onload = process_file;
    reader.readAsText(this.files[0]);
}

function process_file(data) {
  // let user know of potentially slow operation
  alert("Loading... This could take a few seconds");

  let text = data.target.result;
  
  // split on new lines and shuffle
  let lines = text.split("\n").sort(() => Math.random() - 0.5); //.filter(entry => /\S/.test(entry)));

  // create sections
  let i = 0;
  for (const line of lines) {
    let content = [];

    // check prefix and format section appropriately
    if (line.slice(0, 6).toLowerCase() == "taboo:") {
      let length = 6;
      if (line[length] == " ") length += 1;
      content = line.slice(length).split(",").map(item => item.trim());
    }
    else {
      // just forward the section on as content
      content.push(line);
    }

    // create flashcards
    sections.push(create_flashcard(content, i++, i * 137.5 % 360));
  }

  // add lazy loading
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      let section = entry.target;
      if (entry.intersectionRatio >= 0.25) {
        section.firstElementChild.style.opacity = 1;
        current_section = parseInt(section.id.slice(8));
      } else {
        section.firstElementChild.style.opacity = 0;
      }
    })
  }, {
    rootMargin: '0px',
    threshold: 0.25
  });

  sections.forEach((section, index) => {
    carousel_fragment.appendChild(section);
    observer.observe(section);
  });

  // create scroll buttons
  prev.className = "arrow left";
  prev.onclick = () => carousel.scroll(carousel.scrollLeft - window.innerWidth, 0);

  next.className = "arrow right";
  next.onclick = () => carousel.scroll(carousel.scrollLeft + window.innerWidth, 0);

  const show_hide_arrows = () => {
    if (carousel.scrollLeft < window.innerWidth) {
      window.requestAnimationFrame(() => {
        prev.style.opacity = 0.2;
        prev.disabled = true;
      });
    } else {
      window.requestAnimationFrame(() => {
        prev.style.opacity = 1;
        prev.disabled = false;
      });
    };

    if (carousel.scrollLeft >= carousel.scrollWidth - window.innerWidth) {
      window.requestAnimationFrame(() => {
        next.style.opacity = 0.2
        next.disabled = true;
      });
    } else {
      window.requestAnimationFrame(() => {
        next.style.opacity = 1
        next.disabled = false;
      });
    };

  };

  carousel.addEventListener("scroll", show_hide_arrows);

  document.body.appendChild(prev);
  document.body.appendChild(next);

  // signal completion
  carousel.appendChild(carousel_fragment);
  document.body.removeChild(init);
  document.body.appendChild(carousel);

  window.screen.orientation.lock("landscape").catch((e)=>{});
  document.body.requestFullscreen();

  // resize the text once it´s been added to DOM
  sections.forEach( (element) => window.fitText(element) );

  // update the arrows
  show_hide_arrows();
}

function create_flashcard(content, i, hue) {
  let section = document.createElement("section");
  section.id = `section-${i}`;
  section.style.background = `linear-gradient(to top, hsl(${hue},50%,66%) 0%, hsl(0,0%,66%) 100%)`;
  
  if (content.length > 1) {
    // the first is the title, the rest are sub
    let innerHTML = "<div style='width: 88%;' class='content'><dl><dt>" + content[0] + "</dt></dl><ul>";
    for (let i = 1; i < content.length; i++) {
      innerHTML += "<li>" + content[i] + "</li>";
    }

    innerHTML += "</ul></div>";

    section.innerHTML = innerHTML;
  } else {
    // single index array, regular flashsection
    section.innerHTML = `<div class='content'>${content[0]}</div>`;
  }

  return section;
}

// INPUT

(function detectSwipe(){
  let touchstartX = 0,
      touchstartY = 0,
      touchendX = 0,
      touchendY = 0;

  window.addEventListener('touchstart', function(event) {
    touchstartX = event.changedTouches[0].screenX;
    touchstartY = event.changedTouches[0].screenY;
    // document.documentElement.requestFullscreen();
  });
  
  window.addEventListener('touchend', function(event) {
    const SENSITIVITY = 25;
    touchendX = event.changedTouches[0].screenX;
    touchendY = event.changedTouches[0].screenY;
    // determine horizontal swipe
    if (Math.abs(touchstartX - touchendX) > SENSITIVITY)
      touchendX > touchstartX  ? swipe(-1) : swipe(1);
  });
})();

document.addEventListener('wheel', e => {
  console.log('wheel');
  e.deltaY < 0 ? swipe(-1) : swipe(1);
});

function swipe(direction) {
    window.requestAnimationFrame(()=>sections[current_section + direction].scrollIntoView({behavior: "smooth"}));
}