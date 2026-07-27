import { LoginForm } from "./LoginForm.js";
import { SignupForm } from "./SignupForm.js";

export function AuthForms(onAuthSuccess) {
  const container = document.createElement("div");

  // ----------------- Toggle buttons -----------------
  const toggle = document.createElement("div");
  toggle.className = "flex justify-center gap-4 mb-6";

  const loginBtn = document.createElement("button");
  loginBtn.innerText = "Login";
  loginBtn.className = "px-4 py-2 bg-blue-600 text-white rounded";

  const signupBtn = document.createElement("button");
  signupBtn.innerText = "Sign Up";
  signupBtn.className = "px-4 py-2 bg-green-600 text-white rounded";

  toggle.appendChild(loginBtn);
  toggle.appendChild(signupBtn);
  container.appendChild(toggle);

  // ----------------- Forms -----------------
  const loginForm = LoginForm((token, user) => {
    // Save current user globally
    window.currentUser = { token, ...user };
    localStorage.setItem("user", JSON.stringify({ token, ...user }));
    onAuthSuccess(token, user);
  });

  const signupForm = SignupForm((token, user) => {
    window.currentUser = { token, ...user };
    localStorage.setItem("user", JSON.stringify({ token, ...user }));
    onAuthSuccess(token, user);
  });

  // Append forms to container
  container.appendChild(loginForm);
  signupForm.style.display = "none"; // hide signup initially
  container.appendChild(signupForm);

  // ----------------- Toggle logic -----------------
  loginBtn.addEventListener("click", () => {
    loginForm.style.display = "block";
    signupForm.style.display = "none";

    loginBtn.classList.add("bg-blue-700");
    loginBtn.classList.remove("bg-blue-600");
    signupBtn.classList.remove("bg-green-700");
    signupBtn.classList.add("bg-green-600");
  });

  signupBtn.addEventListener("click", () => {
    loginForm.style.display = "none";
    signupForm.style.display = "block";

    signupBtn.classList.add("bg-green-700");
    signupBtn.classList.remove("bg-green-600");
    loginBtn.classList.remove("bg-blue-700");
    loginBtn.classList.add("bg-blue-600");
  });

  return container;
}
