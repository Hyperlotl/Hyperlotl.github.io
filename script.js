

let project_list = [];
const interface_category_list = document.getElementById("categories");
const interface_project_list = document.getElementById("project_list");
const interface_project_info = document.getElementById("project_info");
const interface_header = document.getElementById("title");
const categories = {
  "misc tools/programs": "tools",
  "scratch extensions": "ext",
  "games": "games",
  "libraries": "python",
};
const empty_message = document.createElement("p")
empty_message.textContent="nothing here"
//function to get all projects and store it in an array(returns the array)
function getProjects() {
  const projects = []
  const url = "https://api.github.com/users/Hyperlotl/repos";
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      return response.json();
    })
    .then(repos => {
      repos.forEach(repo => {
        const scanURL = `https://raw.githubusercontent.com/Hyperlotl/${repo.name}/refs/heads/main/scan_data.json`;
        fetch(scanURL)
          .then(scanResponse => {
            if (!scanResponse.ok) {
              // skip silently if file not found
              return;
            }
            return scanResponse.json();
          })
          .then(scanData => {
            if (scanData) {
              let project = {
                name:scanData.name,
                tag:scanData.tag,
                description:scanData.description,
                link:scanData.link
              };
              if (scanData.image_url) {
                project.image_url = scanData.image_url;
              };
              projects.push(project);
            }
          })
          .catch(() => {
            // silently skip any fetch/json error
          });
      });
    })
    .catch(error => {
      console.error("Error fetching repo list:", error.message);
    });
  return(projects);
}
//function to add buttons for all the categories
function Categories() {
  interface_category_list.innerHTML = "";
  interface_project_list.innerHTML = "";
  interface_project_info.innerHTML = "";
  interface_header.textContent = "My projects"
  for (const [name, tag] of Object.entries(categories)) {
    let button = document.createElement("button");
    button.textContent = name;
    const categoryTag = tag;
    button.addEventListener('click', () => {
      GetTagged(categoryTag);
    });
    interface_category_list.appendChild(button);
  }
}
//function that returns all projects with a certain tag
function GetTagged(tag) {
  if (project_list) {
    interface_project_list.innerHTML="";
    project_list.forEach(project_item => {
      if (project_item.tag==tag) {
        interface_project_list.appendChild(createProjectButton(project_item));
        interface_project_list.appendChild(document.createElement('br'));
      }
    });
    if (interface_project_list.innerHTML == "") {
      console.log("inner HTML empty, adding empty message")
      interface_project_list.appendChild(empty_message)
    }
  }
}
//function that create an info page for any project
async function CreateProjectPage(project_name, project_description, project_link, project_type) {
  interface_category_list.innerHTML = "";
  interface_project_list.innerHTML = "";
  interface_project_info.innerHTML = "";
  interface_header.textContent = project_name;

  // back button
  let backButton = document.createElement("button");
  backButton.textContent = "back";
  backButton.addEventListener('click', () => {
    Categories();
  });
  interface_project_info.appendChild(backButton);
  if (project_type == "ext") {
    let copyExtensionButton = document.createElement("button");
    copyExtensionButton.textContent = "copy extension JS to clipboard"
    copyExtensionButton.style.width = "40%"
    copyExtensionButton.addEventListener('click', () => {
      Copy_ext_to_clipboard(project_name);
    })
    interface_project_info.appendChild(copyExtensionButton);
  }
  interface_project_info.appendChild(document.createElement("br"));

  // description(fetches README)
  try {
    const resp = await fetch(`https://raw.githubusercontent.com/Hyperlotl/${project_name}/main/README.md`);
    if (resp.ok) {
      const mdText = await resp.text();
      const container = document.createElement("div");
      container.innerHTML = DOMPurify.sanitize(marked.parse(mdText));
      interface_project_info.appendChild(container);
    } else {
      console.warn("No README for", project_name);
    }
  } catch (err) {
    console.warn("Error fetching README for", project_name, err);
  }

  // link to project
  const link = document.createElement("a");
  link.href = project_link;
  link.textContent = "link to project page";
  link.target = "_blank";
  interface_project_info.appendChild(link);
}
async function Copy_ext_to_clipboard (project_name) {
  try {
    const ext_resp = await fetch(`https://raw.githubusercontent.com/Hyperlotl/${project_name}/main/extension.js`);
    if (ext_resp.ok) {
      const extension = await ext_resp.text()
      navigator.clipboard.writeText(extension)
        .then(() => console.log("Copied to clipboard"))
        .catch(err => console.error("Clipboard failed:", err));
    } else {
      console.warn("No extension.js for", project_name);
    }
  } catch (err) {
    console.warn("Error fetching extension.js for", project_name, err);
  }
}

//function that creates a button for any project which links to the info page
function createProjectButton(project) {
  let button = document.createElement("button");
  button.textContent = project.name;
  button.project_name = project.name;
  button.project_description = project.description;
  button.project_link = project.link;
  button.project_tag = project.tag
  button.addEventListener('click', () => {
    console.log('Button clicked:', button.name);
    CreateProjectPage(button.project_name,button.project_description,button.project_link,project.tag)
  });
  return button
}
window.onload = function() {
  project_list = getProjects();
  console.log(project_list);
  Categories();
  console.log("Page fully loaded!");

};
