// Plain module (not "use client"), so the server layout gets the string
// itself rather than a client reference.

export type Theme = "light" | "dark";
export const THEME_KEY = "theme";

/**
 * Runs in <head> before the first paint: day or night (the saved choice, or
 * the system's), and `data-js`, which holds the hero's entrance until the
 * loader lifts. Without JavaScript the name simply shows.
 */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.setAttribute("data-theme",t)}catch(e){}var d=document.documentElement;d.setAttribute("data-js","");setTimeout(function(){d.setAttribute("data-intro","")},4500)})()`;
