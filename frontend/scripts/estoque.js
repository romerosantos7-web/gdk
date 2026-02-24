// estoque.js
// Array de produtos com todas as informações dos cartões
// Cada objeto representa um cartão disponível no estoque

const estoqueProdutos = [
    {
        id: 1,
        numeroCompleto: "1122331234567890", // 16 dígitos
        validade: "03/28",
        nivel: "Infinite",
        bandeira: "CREDIT",
        banco: "Bradesco",
        preco: 25.00
    },
    {
        id: 2,
        numeroCompleto: "4984089876543210",
        validade: "01/27",
        nivel: "Infinite",
        bandeira: "CREDIT",
        banco: "Banco Do Brasil",
        preco: 70.00
    },
    {
        id: 3,
        numeroCompleto: "5439601111222233",
        validade: "11/29",
        nivel: "Black",
        bandeira: "CREDIT",
        banco: "Itau Unibanco",
        preco: 65.00
    },
    {
        id: 4,
        numeroCompleto: "5439604444555566",
        validade: "08/28",
        nivel: "Black",
        bandeira: "CREDIT",
        banco: "Itau Unibanco",
        preco: 65.00
    }
];

// Se quiser usar em módulo, descomente abaixo:
// export default estoqueProdutos;