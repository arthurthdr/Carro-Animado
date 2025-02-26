let animacaoAtiva = false;

document.getElementById("animar").addEventListener("click", () => {
    const carroContainer = document.getElementById("carro-container");

    if (animacaoAtiva) {
        carroContainer.classList.remove("mover-carro");
        animacaoAtiva = false;
    } else {
        carroContainer.classList.add("mover-carro");
        animacaoAtiva = true;
    }
});
// Classe Carro
class Carro {
    constructor(modelo, cor) {
        this.modelo = modelo;
        this.cor = cor;
        this.velocidade = 0;
        this.ligado = false;
    }

    ligar() {
        if (!this.ligado) {
            this.ligado = true;
            console.log("Carro ligado!");
        } else {
            console.log("O carro já está ligado.");
        }
    }

    desligar() {
        if (this.ligado) {
            this.ligado = false;
            this.velocidade = 0; // Ao desligar, a velocidade volta a ser 0
            this.atualizarVelocidadeNaTela();
            console.log("Carro desligado!");
        } else {
            console.log("O carro já está desligado.");
        }
    }

    acelerar(incremento) {
        if (this.ligado) {
            this.velocidade += incremento;
            this.atualizarVelocidadeNaTela();
            console.log(`Acelerando! Velocidade atual: ${this.velocidade} km/h`);
        } else {
            console.log("O carro precisa estar ligado para acelerar.");
        }
    }

    atualizarVelocidadeNaTela() {
        document.getElementById("velocidade").textContent = this.velocidade;
    }

    mudarCor(novaCor) {
        this.cor = novaCor;
        document.getElementById("cor").textContent = this.cor; // Atualiza na tela
        console.log(`Cor do carro mudada para ${this.cor}`);
    }
}

// Criar um objeto Carro
const meuCarro = new Carro("Sedan", "Prata");

// Exibir informações iniciais do carro na tela
document.getElementById("modelo").textContent = meuCarro.modelo;
document.getElementById("cor").textContent = meuCarro.cor;

// Adicionar eventos aos botões
document.getElementById("ligar").addEventListener("click", () => {
    meuCarro.ligar();
});

document.getElementById("desligar").addEventListener("click", () => {
    meuCarro.desligar();
});

document.getElementById("acelerar").addEventListener("click", () => {
    meuCarro.acelerar(10); // Acelera em 10 km/h
});

document.getElementById("mudarCor").addEventListener("click", () => {
    const novaCor = prompt("Digite a nova cor do carro:");  // Pede a cor ao usuário
    if (novaCor) {  // Verifica se o usuário inseriu alguma cor
        meuCarro.mudarCor(novaCor);
    }
});



// ... (código anterior da classe Carro e eventos dos outros botões)

