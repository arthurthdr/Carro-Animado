// --- Classe Manutencao ---
class Manutencao {
    constructor(data, tipo, custo, descricao = '') {
        // Armazena a data como string no formato YYYY-MM-DD vindo do input date
        this.data = data;
        this.tipo = tipo ? String(tipo).trim() : '';
        this.custo = parseFloat(custo) || 0; // Garante que seja número, 0 se inválido
        this.descricao = descricao ? String(descricao).trim() : '';
    }

    getDataObjeto() {
        if (!this.data) return null;
        // Espera formato YYYY-MM-DD
        const parts = this.data.split('-');
        if (parts.length === 3) {
            // Ano, Mês (0-11), Dia. Adiciona T00:00:00 para evitar problemas de fuso horário
            const dateObj = new Date(`${parts[0]}-${parts[1]}-${parts[2]}T00:00:00`);
            // Verifica se a data criada é válida
            if (!isNaN(dateObj.getTime())) {
                return dateObj;
            }
        }
        console.warn(`Formato de data inválido encontrado: ${this.data}. Esperado YYYY-MM-DD.`);
        return null; // Formato inválido ou data inválida
    }

    validarDados() {
        const dataObj = this.getDataObjeto();
        if (!dataObj) {
            console.error(`Erro validação Manutenção: Data inválida ou formato incorreto (esperado YYYY-MM-DD). Recebido: ${this.data}`);
            return false;
        }

        if (!this.tipo) {
            console.error(`Erro validação Manutenção: Tipo não pode ser vazio.`);
            return false;
        }

        if (isNaN(this.custo) || this.custo < 0) {
            console.error(`Erro validação Manutenção: Custo inválido ou negativo. Recebido: ${this.custo}`);
            return false;
        }
        return true;
    }

    formatarParaExibicao(formatoData = 'DD/MM/AAAA') {
        let dataFormatada = 'Data Inválida';
        const dataObj = this.getDataObjeto();

        if (dataObj) {
            const dia = String(dataObj.getDate()).padStart(2, '0');
            const mes = String(dataObj.getMonth() + 1).padStart(2, '0'); // Meses são 0-11
            const ano = dataObj.getFullYear();
            if (formatoData === 'DD/MM/AAAA') {
                dataFormatada = `${dia}/${mes}/${ano}`;
            } else { // Assume YYYY-MM-DD
                dataFormatada = `${ano}-${mes}-${dia}`;
            }
        }

        const tipoFormatado = this.tipo || 'Tipo Inválido';
        const custoFormatado = this.custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        let resultado = `${tipoFormatado} em ${dataFormatada} - ${custoFormatado}`;
        if (this.descricao) {
            resultado += ` (Descrição: ${this.descricao})`;
        }
        return resultado;
    }

    // Método para serialização (essencial para localStorage)
    toJSON() {
        return {
            data: this.data, // Salva como string YYYY-MM-DD
            tipo: this.tipo,
            custo: this.custo,
            descricao: this.descricao,
        };
    }
}

// --- Classe Veiculo (Base) ---
class Veiculo {
    // tipoVeiculo será a chave para identificar a classe (ex: 'Carro', 'Moto')
    constructor(modelo, cor, tipoVeiculo) {
        if (!tipoVeiculo) throw new Error("tipoVeiculo é obrigatório no construtor de Veiculo.");
        this.modelo = modelo;
        this.cor = cor;
        this.tipoVeiculo = tipoVeiculo; // Essencial para reconstrução
        this.ligado = false;
        this.velocidade = 0;
        this.historicoManutencao = []; // Array de objetos Manutencao
        this.idPrefixo = tipoVeiculo.charAt(0).toLowerCase() + tipoVeiculo.slice(1); // ex: 'carro', 'carroEsportivo'
    }

    ligar() {
        if (this instanceof Bicicleta) {
             exibirNotificacao("Bicicletas não ligam.", 'aviso');
             return;
        }
        if (this.ligado) {
            exibirNotificacao(`${this.modelo} já está ligado.`, 'aviso');
            return;
        }
        this.ligado = true;
        console.log(`${this.tipoVeiculo} ${this.modelo} ligado!`);
        tocarSom(sons.ligar); // Usa o objeto de sons
        this.atualizarEstadoNaTela();
        salvarGaragemNoLocalStorage();
    }

    desligar() {
        if (this instanceof Bicicleta) return; // Não faz nada para bicicleta

        if (!this.ligado) {
            exibirNotificacao(`${this.modelo} já está desligado.`, 'aviso');
            return;
        }
        if (this.velocidade > 0) {
            exibirNotificacao(`Pare o ${this.modelo} antes de desligar!`, 'erro');
            return;
        }
        this.ligado = false;
        console.log(`${this.tipoVeiculo} ${this.modelo} desligado!`);
        tocarSom(sons.desligar);
        this.atualizarEstadoNaTela();
        this.atualizarVelocidadeNaTela(); // Garante que velocidade 0 seja mostrada
        salvarGaragemNoLocalStorage();
    }

    acelerar(incrementoBase) {
        if (this instanceof Bicicleta) {
            const velocidadeMaximaBicicleta = 30;
            if (this.velocidade >= velocidadeMaximaBicicleta) return;
            this.velocidade = Math.min(this.velocidade + incrementoBase, velocidadeMaximaBicicleta);
            console.log(`Pedalando ${this.modelo}! Vel: ${this.velocidade} km/h`);
            this.atualizarVelocidadeNaTela();
            // Não salva estado da bicicleta a cada pedalada (opcional)
            return;
        }

        if (!this.ligado) {
            exibirNotificacao(`Ligue o ${this.modelo} para acelerar!`, 'erro');
            return;
        }

        let incremento = incrementoBase;
        let velocidadeMaxima = this.getVelocidadeMaxima();
        let boost = 1;

        if (this instanceof CarroEsportivo && this.turboAtivado) {
            boost = 1.5;
        } else if (this instanceof Caminhao) {
            const fatorCarga = this.capacidadeCarga > 0 ? Math.max(0.5, 1 - (this.cargaAtual / this.capacidadeCarga) * 0.5) : 1;
            incremento *= fatorCarga;
            console.log(`(Fator Carga: ${fatorCarga.toFixed(2)})`);
        }

        const proximaVelocidade = this.velocidade + (incremento * boost);
        if (this.velocidade >= velocidadeMaxima) return; // Já está no máximo

        this.velocidade = Math.min(proximaVelocidade, velocidadeMaxima);

        console.log(`Acelerando ${this.modelo}! Vel: ${this.velocidade.toFixed(1)} km/h` + (this instanceof CarroEsportivo && this.turboAtivado ? " (TURBO!)" : ""));
        tocarSom(sons.acelerar);
        this.atualizarVelocidadeNaTela();
        // Não salva a cada acelerada para evitar sobrecarga no localStorage
    }

    frear(decremento) {
        if (this.velocidade === 0) return;

        this.velocidade = Math.max(0, this.velocidade - decremento);
        console.log(`Freando ${this.modelo}! Vel: ${this.velocidade.toFixed(1)} km/h`);

        if (this.velocidade > 0 && !(this instanceof Bicicleta)) {
             tocarSom(sons.frear);
        }

        this.atualizarVelocidadeNaTela();
        // Não salvar estado aqui também
    }

    mudarCor(novaCor) {
        const corTrimmed = typeof novaCor === 'string' ? novaCor.trim() : '';
        if (corTrimmed && corTrimmed !== this.cor) {
            this.cor = corTrimmed;
            console.log(`Cor do ${this.modelo} mudada para ${this.cor}`);
            this.atualizarCorNaTela();
            salvarGaragemNoLocalStorage(); // Salva a nova cor
            exibirNotificacao(`Cor do ${this.modelo} alterada para ${this.cor}.`, 'sucesso');
             // Atualiza a cor na área de detalhes se este veículo estiver selecionado
             if (veiculoSelecionado === this) {
                 exibirInformacoesNaTela(this.tipoVeiculo);
             }
        } else if (!corTrimmed) {
            exibirNotificacao("Por favor, insira um nome de cor válido.", 'erro');
        }
    }

     getVelocidadeMaxima() {
        // Método base, subclasses podem sobrescrever
        return 100; // Padrão genérico
     }

    // --- Métodos de Manutenção ---
    adicionarManutencao(manutencaoObj) {
        if (!(manutencaoObj instanceof Manutencao)) {
            console.error(`Erro: Tentativa de adicionar objeto inválido ao histórico de ${this.modelo}.`);
            exibirNotificacao(`Erro interno ao adicionar manutenção para ${this.modelo}.`, 'erro');
            return false;
        }
        // Bicicleta não tem manutenção
        if (this instanceof Bicicleta) {
             exibirNotificacao("Bicicletas não possuem registro de manutenção neste sistema.", 'aviso');
            return false;
        }

        if (manutencaoObj.validarDados()) {
            this.historicoManutencao.push(manutencaoObj);
            // Ordena o histórico por data (mais antiga primeiro) sempre que adicionar
            this.historicoManutencao.sort((a, b) => {
                const dataA = a.getDataObjeto();
                const dataB = b.getDataObjeto();
                if (!dataA) return 1; // Datas inválidas vão para o final
                if (!dataB) return -1;
                return dataA - dataB;
            });
            console.log(`Manutenção adicionada ao ${this.modelo}: ${manutencaoObj.formatarParaExibicao()}`);
            salvarGaragemNoLocalStorage(); // Salva após adicionar manutenção

            // Atualiza a tela de detalhes SE este veículo estiver selecionado
            if (veiculoSelecionado === this) {
                exibirInformacoesNaTela(this.tipoVeiculo);
            }
            exibirNotificacao(`Manutenção para ${this.modelo} registrada/agendada com sucesso!`, 'sucesso');
            verificarAgendamentosProximos(); // Re-verifica lembretes
            return true;
        } else {
            exibirNotificacao(`Erro ao adicionar manutenção para ${this.modelo}: Dados inválidos. Verifique o console.`, 'erro');
            return false;
        }
    }

    getHistoricoManutencaoFormatado() {
        if (this instanceof Bicicleta || this.historicoManutencao.length === 0) {
            return "Nenhum registro de manutenção.";
        }
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const historicoPassado = this.historicoManutencao.filter(m => {
            const dataM = m.getDataObjeto();
            return dataM && dataM <= hoje; // Inclui manutenções de hoje
        });

        if (historicoPassado.length === 0) {
             return "Nenhum registro de manutenção passada.";
        }

        // Ordena do mais recente para o mais antigo para exibição
        historicoPassado.sort((a, b) => b.getDataObjeto() - a.getDataObjeto());

        return historicoPassado.map(m => `- ${m.formatarParaExibicao('DD/MM/AAAA')}`).join('\n');
    }

    getAgendamentosFuturosFormatado() {
        if (this instanceof Bicicleta || this.historicoManutencao.length === 0) {
            return "Nenhum agendamento futuro.";
        }
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const futuros = this.historicoManutencao.filter(m => {
            const dataM = m.getDataObjeto();
            return dataM && dataM > hoje;
        });

        if (futuros.length === 0) {
             return "Nenhum agendamento futuro.";
        }

        // Ordena do mais próximo para o mais distante (já deve estar assim, mas garante)
        futuros.sort((a, b) => a.getDataObjeto() - b.getDataObjeto());

        return futuros.map(m => `- ${m.formatarParaExibicao('DD/MM/AAAA')}`).join('\n');
     }

    // --- Métodos de Atualização da UI (Serão implementados nas subclasses) ---
    atualizarVelocidadeNaTela() {
        const elVel = document.getElementById(`velocidade-${this.idPrefixo}`);
        const elBarra = document.getElementById(`barra-progresso-${this.idPrefixo}`);
        if (elVel) elVel.textContent = this.velocidade.toFixed(this instanceof Caminhao ? 1 : 0); // Caminhão com decimal
        if (elBarra) {
             const maxSpeed = this.getVelocidadeMaxima();
             const percentual = maxSpeed > 0 ? (this.velocidade / maxSpeed) * 100 : 0;
             atualizarBarraDeProgresso(elBarra, percentual);
        }
    }
    atualizarEstadoNaTela() {
         if (this instanceof Bicicleta) return;
         const elEstado = document.getElementById(`estado-${this.idPrefixo}`);
         if (elEstado) {
             elEstado.textContent = this.ligado ? "Ligado" : "Desligado";
             elEstado.style.color = this.ligado ? "green" : "red";
             elEstado.style.fontWeight = "bold";
         }
    }
    atualizarCorNaTela() {
        const elCor = document.getElementById(`cor-${this.idPrefixo}`);
        if (elCor) elCor.textContent = this.cor;
    }

    // Atualiza dados básicos na tela (modelo, cor) - útil na inicialização
    atualizarDadosBaseNaTela() {
         const elModelo = document.getElementById(`modelo-${this.idPrefixo}`);
         const elCor = document.getElementById(`cor-${this.idPrefixo}`);
         if (elModelo) elModelo.textContent = this.modelo;
         if (elCor) elCor.textContent = this.cor;
         // Atualiza outros estados visuais que dependem desses dados base
         this.atualizarCorNaTela(); // Garante que a cor esteja correta
    }

    // Adiciona botão de buzina dinamicamente
    adicionarBotaoBuzina() {
        if (this instanceof Bicicleta) return; // Bicicleta não tem buzina (motorizada)

        const containerId = `controles-${this.idPrefixo}`;
        const container = document.getElementById(containerId);
        if (container && !container.querySelector('.buzina-btn')) {
            const button = document.createElement("button");
            button.textContent = "Buzinar";
            button.classList.add('buzina-btn'); // Classe para estilo CSS
            button.addEventListener("click", () => tocarSom(sons.buzina));

            // Tenta inserir antes do botão de mudar cor para melhor posicionamento
            const refButton = container.querySelector(`button[id^="mudarCor-"]`) || container.querySelector(`button[id^="animar-"]`);
            if (refButton) {
                container.insertBefore(button, refButton);
            } else {
                container.appendChild(button); // Fallback
            }
        }
    }

    // Exibe informações formatadas para a área de detalhes
    exibirInformacoesDetalhes() {
        let info = `<p><strong>Modelo:</strong> ${this.modelo}<br>`;
        info += `<strong>Cor:</strong> ${this.cor}<br>`;
        if (!(this instanceof Bicicleta)) {
            info += `<strong>Estado:</strong> ${this.ligado ? "Ligado" : "Desligado"}<br>`;
        }
        info += `<strong>Velocidade:</strong> ${this.velocidade.toFixed(this instanceof Caminhao ? 1 : 0)} km/h</p>`;

        // Adiciona informações específicas das subclasses
        if (this instanceof CarroEsportivo) {
            info += `<p><strong>Turbo:</strong> <span style="color:${this.turboAtivado ? 'orange' : 'grey'}; font-weight:bold;">${this.turboAtivado ? "Ativado" : "Desativado"}</span></p>`;
        } else if (this instanceof Caminhao) {
            info += `<p><strong>Capacidade:</strong> ${this.capacidadeCarga.toFixed(0)} kg<br>`;
            info += `<strong>Carga Atual:</strong> ${this.cargaAtual.toFixed(0)} kg</p>`;
        }
        return info;
    }


    // --- Método para Serialização do Veículo ---
    toJSON() {
        return {
            modelo: this.modelo,
            cor: this.cor,
            tipoVeiculo: this.tipoVeiculo, // ESSENCIAL
            ligado: this.ligado,
            velocidade: this.velocidade,
            // Serializa cada objeto Manutencao usando seu próprio toJSON
            historicoManutencao: this.historicoManutencao.map(m => m.toJSON()),
            // Propriedades específicas das subclasses (adicionadas nas subclasses)
        };
    }
}

// --- Subclasses ---

class Carro extends Veiculo {
    constructor(modelo, cor) {
        super(modelo, cor, 'Carro');
    }
    getVelocidadeMaxima() { return 180; } // Exemplo

    // Implementações específicas de atualização da UI não são mais necessárias aqui
    // A classe base já faz isso usando o idPrefixo.

    // Botão de animação específico
    adicionarBotaoAnimar() {
        const container = document.getElementById(`controles-${this.idPrefixo}`);
        const btnId = `animar-${this.idPrefixo}`;
        if (container && !document.getElementById(btnId)) {
            const button = document.createElement("button");
            button.id = btnId;
            button.textContent = "Animar";
            let animacaoAtiva = false;
            button.addEventListener("click", () => {
                const veiculoContainer = document.getElementById(`${this.idPrefixo}-container`);
                if(veiculoContainer) {
                    animacaoAtiva = !animacaoAtiva;
                    veiculoContainer.classList.toggle("mover-animacao", animacaoAtiva);
                    button.textContent = animacaoAtiva ? "Parar Animação" : "Animar";
                }
            });
             // Insere depois do mudar cor
             const refButton = container.querySelector(`button[id^="mudarCor-"]`);
             if (refButton && refButton.nextSibling) {
                 container.insertBefore(button, refButton.nextSibling);
             } else {
                container.appendChild(button);
            }
        }
    }

     toJSON() {
         const data = super.toJSON();
         // Nenhuma propriedade extra específica para salvar aqui
         return data;
     }
}

class CarroEsportivo extends Veiculo {
    constructor(modelo, cor) {
        super(modelo, cor, 'CarroEsportivo');
        this.turboAtivado = false;
    }
    getVelocidadeMaxima() { return this.turboAtivado ? 250 : 200; } // Exemplo

    ativarTurbo() {
        if (!this.ligado) { exibirNotificacao(`Ligue o ${this.modelo} primeiro!`, 'erro'); return; }
        if (this.turboAtivado) return;
        this.turboAtivado = true;
        this.atualizarEstadoTurboNaTela();
        console.log("Turbo ativado!");
        exibirNotificacao("Turbo Ativado!", 'aviso');
        salvarGaragemNoLocalStorage();
         // Atualiza a área de detalhes se este veículo estiver selecionado
         if (veiculoSelecionado === this) {
            exibirInformacoesNaTela(this.tipoVeiculo);
        }
    }

    desativarTurbo() {
        if (!this.turboAtivado) return;
        this.turboAtivado = false;
        this.atualizarEstadoTurboNaTela();
        console.log("Turbo desativado.");
        // Não precisa de notificação para desativar talvez
        salvarGaragemNoLocalStorage();
        // Atualiza a área de detalhes se este veículo estiver selecionado
        if (veiculoSelecionado === this) {
             exibirInformacoesNaTela(this.tipoVeiculo);
        }
    }

    atualizarEstadoTurboNaTela() {
        const elTurbo = document.getElementById(`turbo-${this.idPrefixo}`);
        if (elTurbo) {
            elTurbo.textContent = this.turboAtivado ? "Ativado" : "Desativado";
            elTurbo.style.color = this.turboAtivado ? "orange" : "";
            elTurbo.style.fontWeight = this.turboAtivado ? "bold" : "normal";
        }
    }

    // Sobrescreve para incluir o turbo
     atualizarDadosBaseNaTela() {
         super.atualizarDadosBaseNaTela();
         this.atualizarEstadoTurboNaTela();
     }

    toJSON() {
        const data = super.toJSON();
        data.turboAtivado = this.turboAtivado; // Adiciona propriedade específica
        return data;
    }
}

class Caminhao extends Veiculo {
    constructor(modelo, cor, capacidadeCarga) {
        super(modelo, cor, 'Caminhao');
        this.capacidadeCarga = Math.max(0, parseFloat(capacidadeCarga) || 5000); // Padrão 5000kg
        this.cargaAtual = 0;
    }
    getVelocidadeMaxima() { return 120; } // Exemplo

    carregar(quantidade) {
        if (this.ligado) { exibirNotificacao(`Desligue o ${this.modelo} antes de carregar.`, 'erro'); return; }
        const qtdNum = parseFloat(quantidade);
        if (isNaN(qtdNum) || qtdNum <= 0) { exibirNotificacao("Quantidade inválida para carregar.", 'erro'); return; }

        const espacoDisponivel = this.capacidadeCarga - this.cargaAtual;
        const cargaReal = Math.min(qtdNum, espacoDisponivel);

        if (cargaReal <= 0) {
            exibirNotificacao(`${this.modelo} já está cheio (Capacidade: ${this.capacidadeCarga.toFixed(0)} kg).`, 'aviso');
            return;
        }

        this.cargaAtual += cargaReal;
        this.atualizarCargaNaTela();
        console.log(`Carregado: ${cargaReal.toFixed(1)} kg. Carga atual: ${this.cargaAtual.toFixed(1)} kg`);
        exibirNotificacao(`Carregado ${cargaReal.toFixed(0)} kg. Carga total: ${this.cargaAtual.toFixed(0)} kg.`, 'sucesso');
        salvarGaragemNoLocalStorage();
         // Atualiza a área de detalhes se este veículo estiver selecionado
        if (veiculoSelecionado === this) {
            exibirInformacoesNaTela(this.tipoVeiculo);
        }
    }

    descarregar(quantidade) {
        if (this.ligado) { exibirNotificacao(`Desligue o ${this.modelo} antes de descarregar.`, 'erro'); return; }
        const qtdNum = parseFloat(quantidade);
        if (isNaN(qtdNum) || qtdNum <= 0) { exibirNotificacao("Quantidade inválida para descarregar.", 'erro'); return; }

        const descargaReal = Math.min(qtdNum, this.cargaAtual);

        if (descargaReal <= 0) {
            exibirNotificacao(`${this.modelo} já está vazio.`, 'aviso');
            return;
        }

        this.cargaAtual -= descargaReal;
        this.atualizarCargaNaTela();
        console.log(`Descarregado: ${descargaReal.toFixed(1)} kg. Carga atual: ${this.cargaAtual.toFixed(1)} kg`);
        exibirNotificacao(`Descarregado ${descargaReal.toFixed(0)} kg. Carga restante: ${this.cargaAtual.toFixed(0)} kg.`, 'sucesso');
        salvarGaragemNoLocalStorage();
         // Atualiza a área de detalhes se este veículo estiver selecionado
        if (veiculoSelecionado === this) {
             exibirInformacoesNaTela(this.tipoVeiculo);
        }
    }

    atualizarCargaNaTela() {
        const elCargaAtual = document.getElementById(`carga-atual-${this.idPrefixo}`);
        const elCapacidade = document.getElementById(`capacidade-carga-${this.idPrefixo}`);
        if (elCargaAtual) elCargaAtual.textContent = this.cargaAtual.toFixed(0);
        if (elCapacidade) elCapacidade.textContent = this.capacidadeCarga.toFixed(0);
    }

    // Sobrescreve para incluir a carga
    atualizarDadosBaseNaTela() {
        super.atualizarDadosBaseNaTela();
        this.atualizarCargaNaTela();
    }

     // Adiciona botão de descarregar dinamicamente
     adicionarBotaoDescarregar() {
        const containerId = `controles-${this.idPrefixo}`;
        const container = document.getElementById(containerId);
        const btnId = `descarregar-${this.idPrefixo}`;
        const inputId = `quantidade-carga-${this.idPrefixo}`;

        if (container && !document.getElementById(btnId)) {
             const descarregarBtn = document.createElement("button");
             descarregarBtn.id = btnId;
             descarregarBtn.textContent = "Descarregar";
             // Estilo será aplicado pelo CSS via ID ou classe se preferir

             descarregarBtn.addEventListener("click", () => {
                 const inputCarga = document.getElementById(inputId);
                 if(inputCarga) {
                    this.descarregar(inputCarga.value);
                    inputCarga.value = ''; // Limpa input
                 }
             });

             // Insere depois do botão Carregar
             const carregarBtn = container.querySelector(`#carregar-${this.idPrefixo}`);
             if (carregarBtn && carregarBtn.nextSibling) {
                 container.insertBefore(descarregarBtn, carregarBtn.nextSibling);
             } else if (carregarBtn) {
                 container.appendChild(descarregarBtn);
             } else {
                  // Fallback: insere antes do Mudar Cor
                 const mudarCorBtn = container.querySelector(`#mudarCor-${this.idPrefixo}`);
                 if (mudarCorBtn) {
                     container.insertBefore(descarregarBtn, mudarCorBtn);
                 } else {
                     container.appendChild(descarregarBtn);
                 }
             }
        }
     }

    toJSON() {
        const data = super.toJSON();
        data.capacidadeCarga = this.capacidadeCarga;
        data.cargaAtual = this.cargaAtual;
        return data;
    }
}

class Moto extends Veiculo {
    constructor(modelo, cor) {
        super(modelo, cor, 'Moto');
    }
    getVelocidadeMaxima() { return 160; } // Exemplo

    toJSON() {
        const data = super.toJSON();
        // Nenhuma propriedade extra específica
        return data;
    }
}

class Bicicleta extends Veiculo {
    constructor(modelo, cor) {
        super(modelo, cor, 'Bicicleta');
        // Não tem estado 'ligado' visualmente, mas a propriedade existe na classe base
        this.ligado = false; // Manter consistência interna
    }
    getVelocidadeMaxima() { return 35; } // Exemplo

    // Sobrescreve métodos que não se aplicam ou têm comportamento diferente
    ligar() { exibirNotificacao("Bicicletas não ligam.", 'aviso'); }
    desligar() { /* Não faz nada */ }
    adicionarManutencao() {
        exibirNotificacao("Bicicletas não possuem registro de manutenção neste sistema.", 'aviso');
        return false;
    }
    getHistoricoManutencaoFormatado() { return "N/A"; }
    getAgendamentosFuturosFormatado() { return "N/A"; }

     // Não precisa de botão de buzina
     adicionarBotaoBuzina() {}

    toJSON() {
        // Não salva 'ligado' ou 'historicoManutencao' explicitamente se não forem usados
         const data = super.toJSON();
         delete data.ligado; // Remove a propriedade do JSON final
         delete data.historicoManutencao; // Remove a propriedade do JSON final
         return data;
    }
}


// --- Variáveis Globais ---
let veiculos = {}; // Objeto para armazenar as instâncias dos veículos por tipoVeiculo (Carro, Moto, etc.)
let veiculoSelecionado = null; // Referência ao objeto do veículo atualmente selecionado
const GARAGE_STORAGE_KEY = 'garagemInteligenteDadosV2'; // Chave para localStorage (V2 para evitar conflito com dados antigos)
const notificacoesContainer = document.getElementById('notificacoes');
const detalhesContainer = document.getElementById('detalhes-e-agendamento');
const informacoesVeiculoDiv = document.getElementById("informacoesVeiculo");
const agendamentoFormContainer = document.getElementById('agendamento-form-container');
const agendamentosFuturosContainer = document.getElementById('agendamentos-futuros-container');
const agendamentosFuturosConteudo = document.getElementById('agendamentos-futuros-conteudo');
const formAgendamento = document.getElementById('form-agendamento');

// Mapeamento de sons para fácil acesso
const sons = {
    buzina: document.getElementById("som-buzina"),
    acelerar: document.getElementById("som-acelerar"),
    frear: document.getElementById("som-frear"),
    ligar: document.getElementById("som-ligar"),
    desligar: document.getElementById("som-desligar")
};


// --- Funções Auxiliares ---

function tocarSom(elementoAudio) {
    if (elementoAudio && typeof elementoAudio.play === 'function') {
        elementoAudio.currentTime = 0; // Reinicia o som
        elementoAudio.play().catch(error => console.warn("Erro ao tocar som (ignorado):", error)); // Avisa mas não quebra
    } else {
        console.warn("Elemento de áudio inválido:", elementoAudio);
    }
}

function atualizarBarraDeProgresso(elementoBarra, percentual) {
    if (elementoBarra) {
        let p = Math.max(0, Math.min(100, percentual));
        elementoBarra.style.width = `${p}%`;
        // Mudar cor da barra com base no percentual (opcional, mantido do seu código)
        if (p > 85) elementoBarra.style.backgroundColor = '#dc3545'; // Vermelho
        else if (p > 60) elementoBarra.style.backgroundColor = '#ffc107'; // Laranja
        else elementoBarra.style.backgroundColor = '#0d6efd'; // Azul padrão
    }
}

// --- Funções de Notificação ---
function exibirNotificacao(mensagem, tipo = 'info', duracao = 5000) { // Tipos: info, sucesso, aviso, erro
    if (!notificacoesContainer) return;

    const notificacaoDiv = document.createElement('div');
    notificacaoDiv.className = `notificacao ${tipo}`;
    notificacaoDiv.textContent = mensagem;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×'; // Símbolo 'x' mais semântico
    closeBtn.className = 'close-btn';
    closeBtn.setAttribute('aria-label', 'Fechar'); // Acessibilidade
    closeBtn.onclick = (e) => {
        e.stopPropagation(); // Impede que o clique no botão feche a notificação duas vezes
        fecharNotificacao(notificacaoDiv);
    };
    notificacaoDiv.appendChild(closeBtn);

    notificacoesContainer.appendChild(notificacaoDiv);

    // Adiciona classe para animação de entrada (se houver no CSS)
    requestAnimationFrame(() => {
      notificacaoDiv.classList.add('show');
    });

    const timer = setTimeout(() => {
        fecharNotificacao(notificacaoDiv);
    }, duracao);

    // Clicar na notificação também fecha (exceto no botão)
    notificacaoDiv.addEventListener('click', (e) => {
        if (e.target === notificacaoDiv) { // Só fecha se clicar no corpo, não no botão
           clearTimeout(timer);
           fecharNotificacao(notificacaoDiv);
        }
    });
}

function fecharNotificacao(notificacaoDiv) {
    notificacaoDiv.style.opacity = '0';
    notificacaoDiv.style.transform = 'translateX(100%)'; // Animação de saída
    // Remove após a transição CSS terminar (ex: 0.5s)
    setTimeout(() => {
        if (notificacaoDiv.parentNode) {
             notificacaoDiv.remove();
        }
    }, 500); // Tempo deve corresponder à transição no CSS
}


// --- Persistência com LocalStorage ---

// RECONSTRUIR Manutencao a partir de dados crus
function parseManutencao(data) {
    if (!data || typeof data !== 'object') return null;
    const manut = new Manutencao(data.data, data.tipo, data.custo, data.descricao);
    // Valida os dados após criar a instância para garantir integridade
    if (manut.validarDados()) {
        return manut;
    } else {
        console.warn("Dados de manutenção inválidos descartados do localStorage:", data);
        return null; // Descarta manutenção inválida
    }
}

// RECONSTRUIR Veiculo a partir de dados crus
function reconstruirVeiculo(data) {
    if (!data || !data.tipoVeiculo) return null;

    let veiculo = null;
    try {
        // Usa o tipoVeiculo para instanciar a classe correta
        switch (data.tipoVeiculo) {
            case 'Carro':
                veiculo = new Carro(data.modelo, data.cor);
                break;
            case 'CarroEsportivo':
                veiculo = new CarroEsportivo(data.modelo, data.cor);
                // Restaura propriedades específicas se existirem nos dados salvos
                if (data.turboAtivado !== undefined) veiculo.turboAtivado = data.turboAtivado;
                break;
            case 'Caminhao':
                veiculo = new Caminhao(data.modelo, data.cor, data.capacidadeCarga);
                if (data.cargaAtual !== undefined) veiculo.cargaAtual = data.cargaAtual;
                break;
            case 'Moto':
                veiculo = new Moto(data.modelo, data.cor);
                break;
            case 'Bicicleta':
                veiculo = new Bicicleta(data.modelo, data.cor);
                break;
            default:
                console.error(`Tipo de veículo desconhecido encontrado no localStorage: ${data.tipoVeiculo}`);
                return null;
        }

        // Restaura propriedades comuns (se existirem nos dados salvos)
        if (data.ligado !== undefined && !(veiculo instanceof Bicicleta)) veiculo.ligado = data.ligado;
        if (data.velocidade !== undefined) veiculo.velocidade = data.velocidade;

        // Reconstrói o histórico de manutenção (se existir e for um array)
        if (Array.isArray(data.historicoManutencao) && !(veiculo instanceof Bicicleta)) {
            veiculo.historicoManutencao = data.historicoManutencao
                .map(m => parseManutencao(m)) // Usa a função auxiliar para criar instâncias Manutencao
                .filter(m => m !== null) // Remove nulos (manutenções inválidas)
                .sort((a, b) => { // Ordena por data (necessário após reconstrução)
                     const dataA = a.getDataObjeto();
                     const dataB = b.getDataObjeto();
                     if (!dataA) return 1;
                     if (!dataB) return -1;
                     return dataA - dataB;
                 });
        } else {
            veiculo.historicoManutencao = []; // Garante que seja um array vazio
        }

        return veiculo;

    } catch (error) {
        console.error(`Erro ao reconstruir veículo tipo ${data.tipoVeiculo}:`, error, data);
        return null; // Retorna null se a reconstrução falhar
    }
}

// SALVAR a garagem no localStorage
function salvarGaragemNoLocalStorage() {
    try {
        const dadosParaSalvar = {};
        for (const tipo in veiculos) {
            if (veiculos.hasOwnProperty(tipo) && veiculos[tipo]) {
                 // Usa o método toJSON de cada veículo
                 dadosParaSalvar[tipo] = veiculos[tipo].toJSON();
            }
        }
        localStorage.setItem(GARAGE_STORAGE_KEY, JSON.stringify(dadosParaSalvar));
        console.log("Garagem salva no LocalStorage.");
    } catch (error) {
        console.error("Erro ao salvar garagem no LocalStorage:", error);
        exibirNotificacao("Falha ao salvar os dados da garagem. Verifique o console.", 'erro');
    }
}

// CARREGAR a garagem do localStorage
function carregarGaragemDoLocalStorage() {
    const dadosSalvos = localStorage.getItem(GARAGE_STORAGE_KEY);
    veiculos = {}; // Limpa o objeto atual antes de carregar

    if (dadosSalvos) {
        try {
            const dadosParseados = JSON.parse(dadosSalvos);
            let veiculosRecuperados = 0;

            for (const tipo in dadosParseados) {
                if (dadosParseados.hasOwnProperty(tipo)) {
                    const veiculoRec = reconstruirVeiculo(dadosParseados[tipo]);
                    if (veiculoRec) {
                        // Adiciona ao objeto global usando o tipoVeiculo como chave
                        veiculos[tipo] = veiculoRec;
                        veiculosRecuperados++;
                    } else {
                         console.warn(`Falha ao reconstruir veículo do tipo ${tipo}. Dados:`, dadosParseados[tipo]);
                    }
                }
            }

            if (veiculosRecuperados > 0) {
                console.log(`Garagem carregada do LocalStorage com ${veiculosRecuperados} veículo(s).`);
                exibirNotificacao("Dados da garagem carregados.", 'info', 2500);
                return true; // Indica que dados foram carregados
            } else {
                 console.log("Nenhum veículo válido recuperado do localStorage.");
                 // Não conseguiu carregar nenhum, vai criar os padrões
                 return false;
            }

        } catch (error) {
            console.error("Erro ao parsear ou reconstruir dados do LocalStorage:", error);
            exibirNotificacao("Erro ao carregar dados salvos. Resetando para padrões.", 'erro');
            localStorage.removeItem(GARAGE_STORAGE_KEY); // Remove dados corrompidos
            return false; // Indica que houve erro
        }
    } else {
        console.log("Nenhum dado encontrado no LocalStorage para a chave:", GARAGE_STORAGE_KEY);
        return false; // Nenhum dado salvo encontrado
    }
}

// --- Inicialização ---

function inicializarVeiculosPadrao() {
     // Cria instâncias padrão se o localStorage estiver vazio ou corrompido
    console.log("Inicializando veículos com dados padrão.");
    veiculos = {
        Carro: new Carro("Onix", "Prata"),
        CarroEsportivo: new CarroEsportivo("Porsche 911", "Amarelo"),
        Caminhao: new Caminhao("Scania R450", "Azul", 15000), // Capacidade como número
        Moto: new Moto("XRE 300", "Vermelha"),
        Bicicleta: new Bicicleta("Monark Barra Forte", "Verde")
    };
    // Adicionar uma manutenção de exemplo (opcional, só na primeira vez)
    /*
    const manutExemplo = new Manutencao('2024-04-10', 'Troca de Óleo Teste', 150, 'Primeira revisão');
    if (veiculos.Carro) {
        veiculos.Carro.adicionarManutencao(manutExemplo); // Adiciona e já salva
    }
    */
   // Salva os padrões criados no localStorage
   salvarGaragemNoLocalStorage();
}

// Atualiza toda a interface com base nos dados atuais dos veículos
function atualizarInterfaceCompleta() {
    for (const tipo in veiculos) {
        if (veiculos.hasOwnProperty(tipo)) {
            const v = veiculos[tipo];
            // Atualiza dados base (modelo, cor, carga, turbo)
            v.atualizarDadosBaseNaTela();
            // Atualiza estado (ligado/desligado)
            v.atualizarEstadoNaTela();
             // Atualiza velocidade e barra de progresso
            v.atualizarVelocidadeNaTela();
            // Adiciona botões dinâmicos (buzina, descarregar, animar)
            v.adicionarBotaoBuzina();
            if (v instanceof Caminhao) v.adicionarBotaoDescarregar();
            if (v instanceof Carro) v.adicionarBotaoAnimar(); // Apenas no carro comum
        }
    }
     // Se um veículo estiver selecionado, atualiza também a área de detalhes
     if (veiculoSelecionado) {
         exibirInformacoesNaTela(veiculoSelecionado.tipoVeiculo);
     } else {
         // Garante que a área de detalhes esteja oculta se nada estiver selecionado
         detalhesContainer.style.display = 'none';
     }
}


// --- Lógica de Exibição de Informações e Agendamento ---

function exibirInformacoesNaTela(tipoVeiculoKey) {
    const veiculo = veiculos[tipoVeiculoKey];
    if (!veiculo) {
        console.error(`Veículo não encontrado para a chave: ${tipoVeiculoKey}`);
        detalhesContainer.style.display = 'none'; // Esconde detalhes se der erro
        return;
    }

    veiculoSelecionado = veiculo; // Atualiza a variável global
    console.log(`Exibindo informações para: ${tipoVeiculoKey}`);

    // Mostra o container de detalhes
    detalhesContainer.style.display = 'block';

    // Atualiza o botão selecionado (visual)
    document.querySelectorAll('#selecaoVeiculo button').forEach(btn => {
        btn.classList.toggle('selecionado', btn.dataset.tipo === tipoVeiculoKey);
    });

    informacoesVeiculoDiv.innerHTML = ""; // Limpa conteúdo anterior

    // Título e Imagem na área de detalhes
    const titulo = document.createElement("h3");
    // Converte 'CarroEsportivo' para 'Carro Esportivo'
    titulo.textContent = tipoVeiculoKey.replace(/([A-Z])/g, ' $1').trim();
    informacoesVeiculoDiv.appendChild(titulo);

    const imagem = document.createElement("img");
    let imgName = veiculo.idPrefixo; // Usa o prefixo para o nome base
    let imgExt = '.jpg';
    if (tipoVeiculoKey === 'Moto') imgExt = '.webp'; // Caso especial da moto
    if (tipoVeiculoKey === 'CarroEsportivo') imgName = 'carroesportivo'; // Caso especial do esportivo

    imagem.src = `img/${imgName}${imgExt}`;
    imagem.alt = `Imagem do ${titulo.textContent}`;
    imagem.onerror = () => { imagem.style.display = 'none'; console.warn(`Imagem não encontrada: img/${imgName}${imgExt}`);}; // Oculta se não carregar
    informacoesVeiculoDiv.appendChild(imagem);

    // Informações Básicas (usando o método formatado do objeto)
    const infoDiv = document.createElement("div"); // Div para conter o parágrafo
    infoDiv.innerHTML = veiculo.exibirInformacoesDetalhes();
    informacoesVeiculoDiv.appendChild(infoDiv);

    // Histórico e Agendamentos (Apenas para veículos que suportam manutenção)
    if (!(veiculo instanceof Bicicleta)) {
        // Histórico Passado
        const historicoDiv = document.createElement("div");
        const historicoTitulo = document.createElement("h4");
        historicoTitulo.textContent = "Histórico de Manutenção";
        historicoDiv.appendChild(historicoTitulo);
        const historicoConteudo = document.createElement("pre");
        historicoConteudo.textContent = veiculo.getHistoricoManutencaoFormatado();
        historicoDiv.appendChild(historicoConteudo);
        informacoesVeiculoDiv.appendChild(historicoDiv);

        // Agendamentos Futuros (mostra o container e preenche)
        agendamentosFuturosContainer.style.display = 'block';
        agendamentosFuturosConteudo.textContent = veiculo.getAgendamentosFuturosFormatado();

        // Formulário de Agendamento (mostra o container e limpa)
        agendamentoFormContainer.style.display = 'block';
        limparFormularioAgendamento();

    } else {
        // Oculta formulário e agendamentos para bicicleta
        agendamentoFormContainer.style.display = 'none';
        agendamentosFuturosContainer.style.display = 'none';
        const pSemManutencao = document.createElement("p");
        pSemManutencao.textContent = "Bicicletas não possuem histórico ou agendamento de manutenção neste sistema.";
        pSemManutencao.style.fontStyle = "italic";
        pSemManutencao.style.clear = "both"; // Para ficar abaixo da imagem
        informacoesVeiculoDiv.appendChild(pSemManutencao);
    }

    // Rola a página para a seção de detalhes (opcional, bom para mobile)
    // detalhesContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function limparFormularioAgendamento() {
    if (formAgendamento) {
        formAgendamento.reset(); // Reseta os campos do formulário
    }
}

function handleAgendamentoSubmit(event) {
    event.preventDefault(); // Impede o envio padrão do formulário

    if (!veiculoSelecionado || veiculoSelecionado instanceof Bicicleta) {
        exibirNotificacao("Selecione um veículo válido (não bicicleta) para agendar.", 'erro');
        return;
    }

    const dataInput = document.getElementById('agenda-data');
    const tipoInput = document.getElementById('agenda-tipo');
    const custoInput = document.getElementById('agenda-custo');
    const descricaoInput = document.getElementById('agenda-descricao');

    // Validação básica dos inputs (HTML5 'required' já ajuda)
    if (!dataInput.value || !tipoInput.value || custoInput.value === '') {
         exibirNotificacao("Preencha todos os campos obrigatórios (Data, Tipo, Custo).", 'erro');
         return;
    }

    const custo = parseFloat(custoInput.value);
    if (isNaN(custo) || custo < 0) {
        exibirNotificacao("O custo deve ser um número positivo.", 'erro');
        custoInput.focus();
        return;
    }
     // Validação de data futura ou passada (opcional mas útil)
     const dataSelecionada = new Date(dataInput.value + "T00:00:00");
     const hoje = new Date();
     hoje.setHours(0, 0, 0, 0);
     // if (dataSelecionada < hoje) {
     //    // Permite registrar manutenções passadas
     //    console.log("Registrando manutenção passada.");
     // }

    // Cria instância de Manutencao (passando a data como string YYYY-MM-DD)
    const novaManutencao = new Manutencao(
        dataInput.value,
        tipoInput.value,
        custo,
        descricaoInput.value
    );

    // Tenta adicionar ao veículo (validação interna + salvamento + atualização UI)
    if (veiculoSelecionado.adicionarManutencao(novaManutencao)) {
        // Sucesso! Limpa o formulário
        limparFormularioAgendamento();
        // Notificação de sucesso já é exibida por adicionarManutencao
    } else {
         // Notificação de erro já é exibida por adicionarManutencao
         // Focar no campo que pode ter causado erro (ex: tipo ou custo)
         if (!tipoInput.value) tipoInput.focus();
         else if (isNaN(custo) || custo < 0) custoInput.focus();
         else dataInput.focus(); // Foca na data se outros parecerem ok
    }
}


// --- Lembretes de Agendamento ---
function verificarAgendamentosProximos() {
    console.log("Verificando agendamentos próximos...");
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);

    let lembretesEncontrados = 0;

    for (const tipo in veiculos) {
        const veiculo = veiculos[tipo];
        // Verifica apenas veículos que não são bicicleta e têm histórico
        if (veiculo && !(veiculo instanceof Bicicleta) && veiculo.historicoManutencao.length > 0) {
            veiculo.historicoManutencao.forEach(manut => {
                const dataM = manut.getDataObjeto();
                if (dataM) { // Garante que a data é válida
                    dataM.setHours(0, 0, 0, 0); // Compara só a data
                    let mensagemLembrete = '';

                    if (dataM.getTime() === hoje.getTime()) {
                         mensagemLembrete = `LEMBRETE HOJE: ${manut.tipo} - ${veiculo.modelo} (${manut.formatarParaExibicao('DD/MM/AAAA')})`;
                         lembretesEncontrados++;
                         // Exibe imediatamente com duração maior
                         setTimeout(() => exibirNotificacao(mensagemLembrete, 'aviso', 15000 + lembretesEncontrados * 500), lembretesEncontrados * 500);
                    } else if (dataM.getTime() === amanha.getTime()) {
                         mensagemLembrete = `LEMBRETE AMANHÃ: ${manut.tipo} - ${veiculo.modelo} (${manut.formatarParaExibicao('DD/MM/AAAA')})`;
                         lembretesEncontrados++;
                         // Exibe com delay e duração maior
                          setTimeout(() => exibirNotificacao(mensagemLembrete, 'aviso', 15000 + lembretesEncontrados * 500), lembretesEncontrados * 500);
                    }
                }
            });
        }
    }

    if (lembretesEncontrados === 0) {
        console.log("Nenhum agendamento encontrado para hoje ou amanhã.");
    }
}


// --- Configuração dos Event Listeners ---
function setupEventListeners() {
    console.log("Configurando event listeners...");

    // 1. Botões de seleção de veículo
    document.querySelectorAll('#selecaoVeiculo button[data-tipo]').forEach(button => {
        button.addEventListener('click', () => {
            const tipoVeiculo = button.dataset.tipo;
            if (tipoVeiculo) {
                exibirInformacoesNaTela(tipoVeiculo);
            } else {
                console.error("Botão de seleção sem data-tipo:", button);
            }
        });
    });

    // 2. Formulário de agendamento
    if (formAgendamento) {
        formAgendamento.addEventListener('submit', handleAgendamentoSubmit);
    } else {
        console.error("Formulário de agendamento não encontrado no DOM!");
    }

    // 3. Controles dos Veículos (usando delegação de eventos se possível, ou individualmente)
    // Abordagem individual (mais simples de entender inicialmente):
    for (const tipo in veiculos) {
        const v = veiculos[tipo];
        const prefix = v.idPrefixo;

        // Ligar/Desligar (se não for bicicleta)
        if (!(v instanceof Bicicleta)) {
             document.getElementById(`ligar-${prefix}`)?.addEventListener('click', () => v.ligar());
             document.getElementById(`desligar-${prefix}`)?.addEventListener('click', () => v.desligar());
        }

        // Acelerar/Frear
        document.getElementById(`acelerar-${prefix}`)?.addEventListener('click', () => {
            // Define incrementos/decrementos base aqui
            let inc = 10;
            if (v instanceof CarroEsportivo) inc = 15;
            if (v instanceof Caminhao) inc = 5;
            if (v instanceof Moto) inc = 12;
            if (v instanceof Bicicleta) inc = 3;
            v.acelerar(inc);
        });
         document.getElementById(`frear-${prefix}`)?.addEventListener('click', () => {
            let dec = 7;
             if (v instanceof CarroEsportivo) dec = 10;
             if (v instanceof Caminhao) dec = 4;
             if (v instanceof Moto) dec = 9;
             if (v instanceof Bicicleta) dec = 2;
             v.frear(dec);
         });

         // Mudar Cor
        document.getElementById(`mudarCor-${prefix}`)?.addEventListener('click', () => {
            const novaCor = prompt(`Digite a nova cor para ${v.modelo}:`);
            if (novaCor !== null) { // Permite cor vazia para cancelar
                 v.mudarCor(novaCor);
             }
        });

        // Controles Específicos
        if (v instanceof CarroEsportivo) {
            document.getElementById(`ativar-turbo-${prefix}`)?.addEventListener('click', () => v.ativarTurbo());
            document.getElementById(`desativar-turbo-${prefix}`)?.addEventListener('click', () => v.desativarTurbo());
        }
        if (v instanceof Caminhao) {
             document.getElementById(`carregar-${prefix}`)?.addEventListener('click', () => {
                 const inputCarga = document.getElementById(`quantidade-carga-${prefix}`);
                 if (inputCarga) {
                    v.carregar(inputCarga.value);
                    inputCarga.value = ''; // Limpa input
                 }
             });
             // O listener do botão descarregar é adicionado dinamicamente em adicionarBotaoDescarregar()
        }
        if (v instanceof Carro) {
            // O listener do botão animar é adicionado dinamicamente em adicionarBotaoAnimar()
        }
    }
    console.log("Event listeners configurados.");
}


// --- Ponto de Entrada Principal ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Carregado. Iniciando Garagem Inteligente...");

    // 1. Tenta carregar do LocalStorage
    const carregouComSucesso = carregarGaragemDoLocalStorage();

    // 2. Se não carregou ou deu erro, inicializa com padrão
    if (!carregouComSucesso || Object.keys(veiculos).length === 0) {
        console.log("Carregamento falhou ou localStorage vazio. Criando veículos padrão.");
        inicializarVeiculosPadrao();
        // Note que inicializarVeiculosPadrao já chama salvarGaragemNoLocalStorage()
    } else {
        console.log("Veículos carregados com sucesso:", Object.keys(veiculos));
    }

    // 3. Atualiza a interface com os dados (carregados ou padrão)
    // Garante que a UI reflita o estado dos objetos
    atualizarInterfaceCompleta();

    // 4. Configura os event listeners para os botões
    setupEventListeners();

    // 5. Verifica agendamentos próximos ao carregar a página
    verificarAgendamentosProximos();

    console.log("Garagem Inteligente inicializada.");
});