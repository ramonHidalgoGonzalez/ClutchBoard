async function main() {
  console.log("No seed SQL is applied by default. Use ENABLE_MOCK_RIOT=true for demo data.")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
