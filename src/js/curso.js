const noCambia = 'Tomás'
let cambia = '@salinatomass'

function cambiarNombre(nuevoNombre) {
  if(!nuevoNombre) return; // Si nuevoNombre no existe la funcion se termina
  cambia = nuevoNombre
}

const getUserAll = new Promise((todoBien, todoMal) => {
  // Llamar a un API
  setTimeout(() => {
    todoBien('Expectacular 10s')
    // todoMal('Se acabó el tiempo')
  }, 10000)
})

const getUser = new Promise((todoBien, todoMal) => {
  // Llamar a un API
  setTimeout(() => {
    todoBien('Perfecto 3s')
    // todoMal('Se acabó el tiempo')
  }, 3000)
})

// getUser
//   .then(() => {
//     console.log('Todo perfecto');
//   })
//   .catch(err => {
//     console.log(err);
//   })


// Promise.all // Multiples promesas en paralelo
Promise.race([ // Se ejecuta la promesa que se resuelva primero
  getUser,
  getUserAll,
])
  .then(message => {
    console.log(message);
  })
  .catch(err => {
    console.log(err);
  })

// $.ajax('https://randomuser.me/api/', {
//   method: 'GET',
//   success: function(data) {
//     // console.log(data);
//   },
//   error: function(err) {
//     console.log(err);
//   }
// })

fetch('https://randomuser.me/api/') // usuario random
  .then(response => {
    return response.json()
  })
  .then(data => { // response.json()
    console.log('user:', `${data.results[0].name.first} ${data.results[0].name.last}`);
  }) 
  .catch(() => {
    console.log('Algo falló');
  }); // <--- se necesita este punto y coma


(async function load() { 

  const getData = async url => {
    const response = await fetch(url)
    const data = await response.json()
    if(data.data.movie_count > 0) { // Si se ecnontraron peliculas
      return data
    } 
    throw new Error('No se encontró niguún resultado')
  }

  const videoItemTemplate = (movie, category) => {
    return (
      `<div class="primaryPlaylistItem" data-id="${movie.id}" data-category="${category}">
        <div class="primaryPlaylistItem-image">
          <img src="${movie.medium_cover_image}">
        </div>
        <h4 class="primaryPlaylistItem-title">${movie.title}</h4>
      </div>`
    )
  }

  const createTemplate = HTMLString => {
    const html = document.implementation.createHTMLDocument();
    html.body.innerHTML = HTMLString;
    // Se crea un documento html con un head, un body, y dentro del body el HTMLString
    return html.body.children[0];
    // Se retorna ese HTMLString en forma de nodo (no en forma de texto)
  }

  const addEventClick = $element => {
    $element.addEventListener('click', () => {
      showModal($element)
    })
  }

  const renderMovieList = (list, $container, category) => {
    $container.children[0].remove() // remover el gif
    list.forEach(movie => {
      const HTML_STRING = videoItemTemplate(movie, category)
      const movieElement = createTemplate(HTML_STRING)
      const image = movieElement.querySelector('img')
      image.addEventListener('load', (event) => {
        event.target.classList.add('fadeIn')
      })
      $container.append(movieElement) // Append recibe 
      addEventClick(movieElement)
    })
  }

  const setAttributes = ($element, attributes) => {
    for(const key in attributes) {
      $element.setAttribute(key, attributes[key])
    }
  }

  const featuringTemplate = peli => {
    return(
      `<div class="featuring">
        <div class="featuring-image">
          <img src="${peli.medium_cover_image}" width="70" height="100" alt="">
        </div>
        <div class="featuring-content">
          <p class="featuring-title">Pelicula encontrada</p>
          <p class="featuring-album">${peli.title}</p>
        </div>
      </div>`
    )
  }

  const BASE_API = 'https://yts.mx/api/v2/'

  const $featuringContainer = document.getElementById('featuring')

  const $home = document.getElementById('home')
  const $form = document.getElementById('form')
  $form.addEventListener('submit', async (event) => {
    event.preventDefault() // No queremos que la pagina recargue
    $home.classList.add('search-active')
    const $loader = document.createElement('img')
    setAttributes($loader, {
      src: 'src/images/loader.gif',
      height: 50,
      width: 50,
    })
    $featuringContainer.append($loader)

    try {
      const data = new FormData($form)
      const { data: { movies: pelis } } = await getData(`${BASE_API}list_movies.json?limit=1&query_term=${data.get('name')}`)
      const HTMLString = featuringTemplate(pelis[0])
      $featuringContainer.innerHTML = HTMLString
    } catch(error) {
      alert(error.message)
      $home.classList.remove('search-active')
      $loader.remove()
    }
  })

  const cacheExist = async (category) => {
    const listName = `${category}List`
    const cacheList = window.localStorage.getItem(listName)
    if (cacheList) {
      return JSON.parse(cacheList)
    }
    const { data: { movies: data } } = await getData(`${BASE_API}list_movies.json?genre=${category}`)
    window.localStorage.setItem(listName, JSON.stringify(data))
    return data
  }

  const $actionContainer = document.querySelector('#action')
  const $dramaContainer = document.querySelector('#drama')
  const $animationContainer = document.querySelector('#animation')

  const actionList = await cacheExist('action')
  renderMovieList(actionList, $actionContainer, 'action')

  const dramaList = await cacheExist('drama')
  renderMovieList(dramaList, $dramaContainer, 'drama')
  
  const animationList = await cacheExist('animation')
  renderMovieList(animationList, $animationContainer, 'animation')

  const $overlay = document.getElementById('overlay')
  const $modal = document.getElementById('modal')
  const $hideModalButton = $modal.querySelector('#hide-modal')
  
  const modalImage = $modal.querySelector('img')
  const modalTitle = $modal.querySelector('h1')
  const modalDescription = $modal.querySelector('p')

  const findById = (list, id) => {
    return list.find(movie => movie.id === id) 
  }

  const findMovie = (id, category) => {
    switch(category) {
      case 'action':
        return findById(actionList, id)
      case 'drama':
        return findById(dramaList, id)
      default:
        return findById(animationList, id)
    }
    
  }

  const showModal = ($element) => {
    $overlay.classList.add('active')
    $modal.style.animation = 'modalIn .8s forwards'
    const id = Number($element.dataset.id)
    const category = $element.dataset.category
    const data = findMovie(id, category)
    modalTitle.textContent = data.title
    modalDescription.textContent = data.description_full
    modalImage.setAttribute('src', data.medium_cover_image)
  }
  
  $hideModalButton.addEventListener('click', hideModal)

  function hideModal() {
    $overlay.classList.remove('active')
    $modal.style.animation = 'modalOut .8s forwards'
  }  
})() // sintaxis para que se auto-ejecute


console.log('One');
console.log('Two');
console.log('Three');

