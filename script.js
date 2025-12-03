// CONFIGURAÇÕES DA URL E FRASE
    // Substitua esta URL pela que deseja consultar. O placeholder {CIDADE} e {DATA} serão substituídos.
    const URL_BASE = "https://www.sanepar.com.br/utilidades-publicas/{CIDADE}-{DATA}/{CIDADE}"; 

    // Frase específica que você está procurando no conteúdo da página
    const FRASE_ALVO = "OOPS! Precisa de ajuda para encontrar um conteúdo?";

    let textoMontado = ""; // Variável inicializada fora do escopo do try-catch para uso global

    async function iniciarProcesso() {
        const inputCidade = document.getElementById('inputCidade').value;
        const inputData = document.getElementById('inputData').value;
        const resultadoDiv = document.getElementById('resultado');
        
        resultadoDiv.style.color = "";
        resultadoDiv.innerText = "Consultando a Sanepar...";

        // Formatar o nome da cidade
        const cidadeFormatada = inputCidade.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "-");

        // 1. Validação simples do formato dd/mm/yyyy
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(inputData)) {
            resultadoDiv.innerText = "Erro: Por favor, insira a data no formato dd/mm/yyyy.";
            return;
        }

        try {
            // 2. Formatar data: de 'dd/mm/yyyy' para 'dd-mm-yyyy' (ou outro formato que a URL exija)
            // O split quebra a string nas barras e o join junta com traços.
            const dataFormatada = inputData.split('/').join('-'); 
            // Nota: Ajustei para " de " pois a Wikipedia usa "25 de dezembro". 
            // Para dd-mm-yyyy estrito, use: input.split('/').join('-';

            // Inserir na URL específica
            const urlAlvo = URL_BASE.replace(/{CIDADE}/g, cidadeFormatada).replace("{DATA}", dataFormatada);
            console.log("URL Montada:", urlAlvo);

            // 3. CONSULTA (CRAWLING)
            // Usa o corsproxy.io que retorna o TEXTO puro, não JSON.
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(urlAlvo)}`;
            var encontrou = true;
            var textoMontado = "Existe possibilidade de falta d'água na cidade na data informada:\n";

            try
            {
                const response = await fetch(proxyUrl);
                
                if (!response.ok) {
                    throw new Error(`Erro HTTP: ${response.status}`);
                }
            
                const conteudoPagina = await response.text();  // Conteúdo HTML bruto da página alvo
                
                // Debug: Se quiser ver o que chegou, descomente a linha abaixo e olhe o Console (F12)
                // console.log(conteudoPagina);

                // 4. Verificar se a frase existe (Case insensitive - maiúsculas/minúsculas não importam)
                // Se quiser estrito, remova os .toLowerCase()
                encontrou = conteudoPagina.toLowerCase().includes(FRASE_ALVO.toLowerCase());

                if(!encontrou)
                {
                    //Buscar tags específicas para montar um texto de retorno
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(conteudoPagina, 'text/html');

                    // Buscar informações específicas
                    const affectedLocationField = doc.querySelector('span.affected-location-field')?.textContent || "";
                    const startDate = doc.querySelector('span.start-date')?.textContent || "";
                    const dateReturn = doc.querySelector('span.date-return')?.textContent || "";

                    const reasonTextWrapperDirect = doc.querySelector('div.reason-text-wrapper > span')?.textContent || "";
                    const reasonTextWrapperNested = Array.from(doc.querySelectorAll('div.reason-text-wrapper div span'))
                        .map(span => span.textContent.trim()) // Remove espaços antes e depois das frases
                        .filter((value, index, self) => self.indexOf(value) === index && value !== "Motivo") // Remove duplicados e a linha "Motivo"
                        .join('\n');

                    const locationsTextWrapper = Array.from(doc.querySelectorAll('div.locations-text-wrapper span'))
                        .map(span => span.textContent)
                        .join('\n');

                    const locationsTextWrapperDiv = doc.querySelector('div.locations-text-wrapper div')?.textContent || "";

                    // Montar texto final
                    textoMontado = `Local afetado: ${affectedLocationField}\nData de início: ${startDate}\nData de retorno: ${dateReturn}\n\nMotivo:\n${reasonTextWrapperDirect}\n${reasonTextWrapperNested}\n\n${locationsTextWrapper}\n${locationsTextWrapperDiv}`;
                    
                }
            }
            catch (error)
            {
                //throw new Error("Erro ao buscar a página via proxy: " + error.message);
                encontrou = true;
            }

            // 5. Retornar TRUE ou FALSE como frase
            if (encontrou) {
                resultadoDiv.style.color = "green";
                resultadoDiv.innerText = `Não possui problemas de falta d'água`;
            } else {
                resultadoDiv.style.color = "red";
                resultadoDiv.innerText = `${textoMontado}`;
            }

        } catch (error) {
            console.error(error);
            resultadoDiv.style.color = "orange";
            resultadoDiv.innerText = "Ocorreu um erro ao tentar acessar a página. Verifique o console (F12) para detalhes.";
        }
    }

    function obterDataAtual() {
        const hoje = new Date();
        const dia = String(hoje.getDate()).padStart(2, '0');
        const mes = String(hoje.getMonth() + 1).padStart(2, '0'); // Janeiro é 0!
        const ano = hoje.getFullYear();
        return `${dia}/${mes}/${ano}`;
    }

    function alterarData(dias) {
        const inputData = document.getElementById('inputData');
        const partesData = inputData.value.split('/');

        if (partesData.length === 3) {
            const dia = parseInt(partesData[0], 10);
            const mes = parseInt(partesData[1], 10) - 1; // Meses começam em 0 no objeto Date
            const ano = parseInt(partesData[2], 10);

            const data = new Date(ano, mes, dia);
            data.setDate(data.getDate() + dias);

            const novoDia = String(data.getDate()).padStart(2, '0');
            const novoMes = String(data.getMonth() + 1).padStart(2, '0');
            const novoAno = data.getFullYear();

            inputData.value = `${novoDia}/${novoMes}/${novoAno}`;

            // Acionar a consulta automaticamente
            iniciarProcesso();
        }
    }

    async function validarCampos() {
        const inputCidade = document.getElementById('inputCidade').value.trim();
        const inputData = document.getElementById('inputData').value.trim();
        const inputUF = document.getElementById('inputUF').value.trim();

        if (!inputUF) {
            alert('Por favor, preencha o campo UF.');
            return;
        }

        if (!inputCidade) {
            alert('Por favor, preencha o campo Cidade.');
            return;
        }

        if (!inputData) {
            alert('Por favor, preencha o campo Data.');
            return;
        }

        try {
            // Consultar API do IBGE para verificar se a cidade pertence à UF informada
            const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${inputUF}/municipios`);

            if (!response.ok) {
                throw new Error('Erro ao consultar a API do IBGE.');
            }

            const municipios = await response.json();
            const cidadesPermitidas = municipios.map(municipio => municipio.nome.toLowerCase());

            if (!cidadesPermitidas.includes(inputCidade.toLowerCase())) {
                alert(`A cidade informada não pertence à UF ${inputUF}.`);
                return;
            }

            iniciarProcesso();
        } catch (error) {
            console.error('Erro ao validar a cidade:', error);
            alert('Ocorreu um erro ao validar a cidade. Tente novamente mais tarde.');
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const inputData = document.getElementById('inputData');
        const verificarButton = document.getElementById('verificarButton');

        inputData.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                verificarButton.click();
            }
        });

        inputData.addEventListener('input', (event) => {
            let value = event.target.value.replace(/\D/g, ''); // Remove tudo que não for número
            if (value.length > 2) value = value.slice(0, 2) + '/' + value.slice(2);
            if (value.length > 5) value = value.slice(0, 5) + '/' + value.slice(5);
            event.target.value = value;
        });

        inputData.setAttribute('inputmode', 'numeric'); // Habilita teclado numérico no Android
    });