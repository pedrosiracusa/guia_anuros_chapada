# Guia Anfíbios dos Veadeiros


## Instalação
Para construir o projeto, é necessário instalar o Ruby:
```sudo apt-get install ruby-full```

Instalar a gem bundler:
```sudo gem install bundler```


Em seguida, ajustar a configuração do bundler para o diretório de instalação das gems:
```bundle config set --local path '~/.gem'```

Para executar localmente, após a instalação:
```bundle exec jekyll serve --livereload```




# Boostrap 4 Github Pages

[![Build Status](https://travis-ci.org/nicolas-van/bootstrap-4-github-pages.svg?branch=master)](https://travis-ci.org/nicolas-van/bootstrap-4-github-pages)

A [Bootstrap 4](https://getbootstrap.com/) start up project for [Github Pages](https://pages.github.com/) and [Jekyll](https://jekyllrb.com/).

* A full Bootstrap 4 theme usable both on Github Pages and with a standalone Jekyll.
* Recompiles Bootstrap from SCSS files, which allows to customize Bootstrap's variables and use Bootstrap themes.
* Full support of Bootstrap's JavaScript plugins.
* Supports all features of Github Pages and Jekyll.

[See the website for demonstration and documentation](https://nicolas-van.github.io/bootstrap-4-github-pages/).

## Contribution

[See the contribution guide.](./CONTRIBUTING.md)

## License

[See the license file.](./LICENSE.md)


## Usando Service Workers (PWA)

Tutorial em https://fredrickb.com/2019/07/25/turning-jekyll-site-into-a-progressive-web-app/

Basicamente, construir um manifest.json e um workbox-config.js e colocá-los na head, como tags. Também criar o main.js no diretório de javascript do site.

Observações:
1. Usaremos o comando ```workbox wizard; workbox generateSW workbox-config.js``` para gerar o service worker sw.js , após a build
1. Devemos apenas mandar o Jekyll fazer a build do site. Para servi-lo temos que usar outro web server, usando a mesma porta (para não reconstruir tudo automaticamente e perder o service worker)