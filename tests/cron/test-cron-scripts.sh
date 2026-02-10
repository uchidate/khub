#!/bin/bash
# ============================================================
# TDD - Testes para Scripts de Cron
# Valida sintaxe, estrutura e integridade dos scripts
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Função de log
log_test() {
    local status=$1
    local message=$2

    TESTS_RUN=$((TESTS_RUN + 1))

    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓${NC} $message"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}✗${NC} $message"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    elif [ "$status" = "SKIP" ]; then
        echo -e "${YELLOW}⊘${NC} $message (skipped)"
    fi
}

echo "==========================================="
echo "  TDD - Cron Scripts Tests"
echo "==========================================="
echo ""

# ===========================================================================
# TEST SUITE 1: Sintaxe Bash
# ===========================================================================

echo "📋 Test Suite 1: Bash Syntax Validation"
echo "-------------------------------------------"

CRON_SCRIPTS=(
    "auto-generate-content.sh"
    "monitor-health.sh"
    "cleanup-cron.sh"
    "fix-crontab.sh"
    "setup-auto-generation.sh"
    "export-cron-info.sh"
)

for script in "${CRON_SCRIPTS[@]}"; do
    if [ -f "$SCRIPTS_DIR/$script" ]; then
        if bash -n "$SCRIPTS_DIR/$script" 2>/dev/null; then
            log_test "PASS" "Sintaxe válida: $script"
        else
            log_test "FAIL" "Erro de sintaxe: $script"
            bash -n "$SCRIPTS_DIR/$script" || true
        fi
    else
        log_test "SKIP" "Script não encontrado: $script"
    fi
done

echo ""

# ===========================================================================
# TEST SUITE 2: Permissões de Execução
# ===========================================================================

echo "🔐 Test Suite 2: Execution Permissions"
echo "-------------------------------------------"

for script in "${CRON_SCRIPTS[@]}"; do
    if [ -f "$SCRIPTS_DIR/$script" ]; then
        if [ -x "$SCRIPTS_DIR/$script" ]; then
            log_test "PASS" "Permissão de execução OK: $script"
        else
            log_test "FAIL" "Sem permissão de execução: $script"
        fi
    fi
done

echo ""

# ===========================================================================
# TEST SUITE 3: Shebang Correto
# ===========================================================================

echo "📝 Test Suite 3: Shebang Validation"
echo "-------------------------------------------"

for script in "${CRON_SCRIPTS[@]}"; do
    if [ -f "$SCRIPTS_DIR/$script" ]; then
        FIRST_LINE=$(head -n 1 "$SCRIPTS_DIR/$script")
        if [[ "$FIRST_LINE" == "#!/bin/bash" ]] || [[ "$FIRST_LINE" == "#!/usr/bin/env bash" ]]; then
            log_test "PASS" "Shebang correto: $script"
        else
            log_test "FAIL" "Shebang incorreto ou ausente: $script (encontrado: $FIRST_LINE)"
        fi
    fi
done

echo ""

# ===========================================================================
# TEST SUITE 4: Heredoc Validation (EOF fechado corretamente)
# ===========================================================================

echo "📄 Test Suite 4: Heredoc Validation"
echo "-------------------------------------------"

for script in "${CRON_SCRIPTS[@]}"; do
    if [ -f "$SCRIPTS_DIR/$script" ]; then
        # Verificar se tem heredoc
        if grep -q "<<EOF" "$SCRIPTS_DIR/$script"; then
            # Contar abertura e fechamento de EOF
            OPEN_COUNT=$(grep -c "<<EOF" "$SCRIPTS_DIR/$script" || echo 0)
            # EOF deve estar sozinho na linha (não colado com })
            CLOSE_COUNT=$(grep -c "^EOF$" "$SCRIPTS_DIR/$script" || echo 0)

            if [ "$OPEN_COUNT" -eq "$CLOSE_COUNT" ]; then
                log_test "PASS" "Heredocs balanceados: $script ($OPEN_COUNT heredocs)"
            else
                log_test "FAIL" "Heredocs desbalanceados: $script (abertos: $OPEN_COUNT, fechados: $CLOSE_COUNT)"
            fi
        else
            log_test "SKIP" "Sem heredocs: $script"
        fi
    fi
done

echo ""

# ===========================================================================
# TEST SUITE 5: Logs Directory Check
# ===========================================================================

echo "📁 Test Suite 5: Log Paths Validation"
echo "-------------------------------------------"

for script in "${CRON_SCRIPTS[@]}"; do
    if [ -f "$SCRIPTS_DIR/$script" ]; then
        # Verificar se script redireciona para logs
        if grep -q "/logs/" "$SCRIPTS_DIR/$script"; then
            # Verificar se usa path absoluto /var/www/hallyuhub/logs
            if grep -q "/var/www/hallyuhub/logs/" "$SCRIPTS_DIR/$script"; then
                log_test "PASS" "Path absoluto para logs: $script"
            else
                log_test "FAIL" "Path relativo ou inconsistente para logs: $script"
            fi
        else
            log_test "SKIP" "Script não usa logs: $script"
        fi
    fi
done

echo ""

# ===========================================================================
# TEST SUITE 6: Set -e (Exit on Error)
# ===========================================================================

echo "⚠️  Test Suite 6: Error Handling (set -e)"
echo "-------------------------------------------"

for script in "${CRON_SCRIPTS[@]}"; do
    if [ -f "$SCRIPTS_DIR/$script" ]; then
        if grep -q "^set -e" "$SCRIPTS_DIR/$script"; then
            log_test "PASS" "Exit on error habilitado: $script"
        else
            log_test "FAIL" "Exit on error NÃO habilitado: $script (recomendado adicionar 'set -e')"
        fi
    fi
done

echo ""

# ===========================================================================
# TEST SUITE 7: Crontab Format Validation
# ===========================================================================

echo "🕐 Test Suite 7: Crontab Schedule Format"
echo "-------------------------------------------"

CRON_PATTERNS=(
    "*/15 * * * *"
    "*/30 * * * *"
    "0 3 * * *"
    "0 0 * * *"
    "0 */4 * * *"
)

# Verificar setup-auto-generation.sh
if [ -f "$SCRIPTS_DIR/setup-auto-generation.sh" ]; then
    for pattern in "${CRON_PATTERNS[@]}"; do
        if grep -q "$pattern" "$SCRIPTS_DIR/setup-auto-generation.sh"; then
            log_test "PASS" "Padrão cron encontrado: $pattern"
        fi
    done
fi

# Verificar fix-crontab.sh
if [ -f "$SCRIPTS_DIR/fix-crontab.sh" ]; then
    for pattern in "${CRON_PATTERNS[@]}"; do
        if grep -q "$pattern" "$SCRIPTS_DIR/fix-crontab.sh"; then
            log_test "PASS" "Padrão cron encontrado em fix-crontab.sh: $pattern"
        fi
    done
fi

echo ""

# ===========================================================================
# TEST SUITE 8: Docker Command Validation
# ===========================================================================

echo "🐳 Test Suite 8: Docker Commands"
echo "-------------------------------------------"

for script in "${CRON_SCRIPTS[@]}"; do
    if [ -f "$SCRIPTS_DIR/$script" ]; then
        if grep -q "docker" "$SCRIPTS_DIR/$script"; then
            # Verificar se usa docker-compose ou docker exec com path correto
            if grep -E "(docker-compose -f|docker exec)" "$SCRIPTS_DIR/$script" > /dev/null; then
                log_test "PASS" "Comandos Docker corretos: $script"
            else
                log_test "FAIL" "Comandos Docker podem estar incorretos: $script"
            fi
        else
            log_test "SKIP" "Script não usa Docker: $script"
        fi
    fi
done

echo ""

# ===========================================================================
# TEST SUITE 9: Export Cron Info JSON Validation
# ===========================================================================

echo "📊 Test Suite 9: Cron Info Export"
echo "-------------------------------------------"

if [ -f "$SCRIPTS_DIR/export-cron-info.sh" ]; then
    # Criar ambiente de teste temporário
    TEMP_DIR=$(mktemp -d)
    export OUTPUT_FILE="$TEMP_DIR/cron-config-test.json"

    # Simular crontab vazio
    echo "# Test crontab" > "$TEMP_DIR/test-crontab.txt"
    echo "*/15 * * * * /var/www/hallyuhub/scripts/auto-generate-content.sh >> /var/www/hallyuhub/logs/cron-direct.log 2>&1" >> "$TEMP_DIR/test-crontab.txt"

    # Executar script de export (com mock do crontab)
    (
        cd "$SCRIPTS_DIR"
        # Mock crontab -l
        function crontab() {
            if [ "$1" = "-l" ]; then
                cat "$TEMP_DIR/test-crontab.txt"
            fi
        }
        export -f crontab

        # Executar
        ENV=production OUTPUT_FILE="$OUTPUT_FILE" bash export-cron-info.sh > /dev/null 2>&1 || true
    )

    # Verificar se JSON foi criado
    if [ -f "$OUTPUT_FILE" ]; then
        # Validar JSON
        if python3 -m json.tool "$OUTPUT_FILE" > /dev/null 2>&1; then
            log_test "PASS" "JSON válido gerado por export-cron-info.sh"
        else
            log_test "FAIL" "JSON inválido gerado por export-cron-info.sh"
        fi
    else
        log_test "FAIL" "Arquivo JSON não foi criado por export-cron-info.sh"
    fi

    # Limpar
    rm -rf "$TEMP_DIR"
else
    log_test "SKIP" "export-cron-info.sh não encontrado"
fi

echo ""

# ===========================================================================
# TEST SUITE 10: Documentação Existe
# ===========================================================================

echo "📚 Test Suite 10: Documentation"
echo "-------------------------------------------"

if [ -f "$PROJECT_ROOT/docs/CRON_MANAGEMENT.md" ]; then
    log_test "PASS" "Documentação de crons existe (CRON_MANAGEMENT.md)"

    # Verificar se doc menciona os scripts principais
    for script in "${CRON_SCRIPTS[@]}"; do
        if grep -q "$script" "$PROJECT_ROOT/docs/CRON_MANAGEMENT.md"; then
            log_test "PASS" "Script documentado: $script"
        else
            log_test "FAIL" "Script NÃO documentado: $script"
        fi
    done
else
    log_test "FAIL" "Documentação de crons NÃO existe (docs/CRON_MANAGEMENT.md)"
fi

echo ""

# ===========================================================================
# SUMMARY
# ===========================================================================

echo "==========================================="
echo "  Test Summary"
echo "==========================================="
echo "Total tests run:    $TESTS_RUN"
echo -e "${GREEN}Tests passed:      $TESTS_PASSED${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}Tests failed:      $TESTS_FAILED${NC}"
else
    echo "Tests failed:      0"
fi
echo "==========================================="
echo ""

if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}❌ TESTS FAILED${NC}"
    exit 1
else
    echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
    exit 0
fi
